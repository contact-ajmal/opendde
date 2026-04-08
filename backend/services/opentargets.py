import httpx

UNIPROT_BASE = "https://rest.uniprot.org"
OT_GRAPHQL = "https://api.platform.opentargets.org/api/v4/graphql"

QUERY = """
query TargetSafety($ensemblId: String!) {
  target(ensemblId: $ensemblId) {
    id
    approvedSymbol
    tractability { modality label value }
    safetyLiabilities {
      event
      effects { direction dosing }
      biosamples { tissueLabel }
    }
    drugAndClinicalCandidates { count }
    associatedDiseases(page: { size: 10, index: 0 }) {
      rows { disease { name } score }
    }
  }
}
"""


async def _uniprot_to_ensembl(uniprot_id: str, client: httpx.AsyncClient) -> str | None:
    """Map UniProt accession to Ensembl Gene ID via UniProt API."""
    resp = await client.get(
        f"{UNIPROT_BASE}/uniprotkb/{uniprot_id}",
        params={"fields": "xref_ensembl", "format": "json"},
    )
    if resp.status_code != 200:
        return None
    data = resp.json()
    for xref in data.get("uniProtKBCrossReferences", []):
        if xref.get("database") == "Ensembl":
            for prop in xref.get("properties", []):
                if prop.get("key") == "GeneId":
                    gene_id = prop["value"]
                    # Strip version suffix (e.g. ENSG00000146648.22 → ENSG00000146648)
                    return gene_id.split(".")[0]
    return None


def _summarize_tractability(tractability: list[dict]) -> dict:
    """Summarize tractability into top category per modality."""
    result = {}
    modality_map = {"SM": "small_molecule", "AB": "antibody", "PR": "protac", "OC": "other"}
    # Priority order: Approved Drug > Advanced Clinical > Phase 1 Clinical > predicted categories
    priority = [
        "Approved Drug",
        "Advanced Clinical",
        "Phase 1 Clinical",
        "Structure with Ligand",
        "High-Quality Ligand",
        "High-Quality Pocket",
        "Med-Quality Pocket",
        "Druggable Family",
        "UniProt loc high conf",
        "GO CC high conf",
        "UniProt loc med conf",
        "UniProt SigP or TMHMM",
        "HPA main location",
    ]

    for mod_code, mod_name in modality_map.items():
        entries = [t for t in tractability if t["modality"] == mod_code and t["value"]]
        if not entries:
            continue
        # Pick the highest-priority true label
        best = None
        best_idx = len(priority)
        for e in entries:
            try:
                idx = priority.index(e["label"])
            except ValueError:
                idx = len(priority)
            if idx < best_idx:
                best_idx = idx
                best = e["label"]
        if best:
            result[mod_name] = best

    return result


def _summarize_safety(liabilities: list[dict]) -> list[dict]:
    """Deduplicate and summarize safety liabilities."""
    seen = set()
    results = []
    for sl in liabilities:
        event = sl.get("event", "").strip()
        if not event:
            continue
        event_lower = event.lower()
        if event_lower in seen:
            continue
        seen.add(event_lower)

        direction = None
        for eff in sl.get("effects", []):
            if eff.get("direction"):
                direction = eff["direction"]
                break

        tissues = []
        for bs in sl.get("biosamples", []):
            label = bs.get("tissueLabel")
            if label:
                tissues.append(label)

        results.append({
            "event": event,
            "direction": direction,
            "tissue": tissues[0] if tissues else None,
        })
    return results


async def fetch_safety_profile(uniprot_id: str) -> dict | None:
    """Fetch safety & tractability data from OpenTargets for a given UniProt ID."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        ensembl_id = await _uniprot_to_ensembl(uniprot_id, client)
        if not ensembl_id:
            return None

        resp = await client.post(
            OT_GRAPHQL,
            json={"query": QUERY, "variables": {"ensemblId": ensembl_id}},
        )
        if resp.status_code != 200:
            return None

        data = resp.json()
        target = data.get("data", {}).get("target")
        if not target:
            return None

        tractability = _summarize_tractability(target.get("tractability", []))
        safety = _summarize_safety(target.get("safetyLiabilities", []))
        drugs = target.get("drugAndClinicalCandidates", {})
        known_drugs_count = drugs.get("count", 0) if drugs else 0

        disease_rows = target.get("associatedDiseases", {}).get("rows", [])
        diseases = [
            {"disease": row["disease"]["name"], "score": round(row["score"], 4)}
            for row in disease_rows
        ]

        return {
            "ensembl_id": ensembl_id,
            "symbol": target.get("approvedSymbol"),
            "tractability": tractability,
            "safety_liabilities": safety,
            "known_drugs_count": known_drugs_count,
            "top_disease_associations": diseases,
        }
