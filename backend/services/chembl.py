from urllib.parse import quote

import httpx

CHEMBL_BASE = "https://www.ebi.ac.uk/chembl/api/data"
PUBCHEM_IMG = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/{smiles}/PNG?image_size=150x150"

PHASE_LABELS = {
    0: "Preclinical",
    1: "Phase I",
    2: "Phase II",
    3: "Phase III",
    4: "Approved",
}


async def fetch_known_ligands(uniprot_id: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step a: resolve UniProt → ChEMBL target
        resp = await client.get(
            f"{CHEMBL_BASE}/target",
            params={
                "target_components__accession": uniprot_id,
                "format": "json",
            },
        )
        resp.raise_for_status()
        targets = resp.json().get("targets", [])
        if not targets:
            return []

        target_chembl_id = targets[0]["target_chembl_id"]

        # Step b: fetch activities
        resp = await client.get(
            f"{CHEMBL_BASE}/activity",
            params={
                "target_chembl_id": target_chembl_id,
                "standard_type__in": "IC50,Ki,Kd",
                "format": "json",
                "limit": "100",
                "order_by": "standard_value",
            },
        )
        resp.raise_for_status()
        activities = resp.json().get("activities", [])

        # Step c: deduplicate — keep best (lowest) value per molecule
        best_by_mol: dict[str, dict] = {}
        for act in activities:
            mol_id = act.get("molecule_chembl_id")
            if not mol_id:
                continue
            value = act.get("standard_value")
            if value is None:
                continue
            try:
                value = float(value)
            except (ValueError, TypeError):
                continue

            if mol_id not in best_by_mol or value < best_by_mol[mol_id]["value"]:
                best_by_mol[mol_id] = {
                    "chembl_id": mol_id,
                    "activity_type": act.get("standard_type", ""),
                    "value": value,
                    "smiles": act.get("canonical_smiles", ""),
                }

        # Sort by activity value, take top 20 for enrichment
        sorted_mols = sorted(best_by_mol.values(), key=lambda x: x["value"])
        top_mols = sorted_mols[:20]

        # Step d: fetch molecule details for name and max_phase
        for mol in top_mols:
            try:
                resp = await client.get(
                    f"{CHEMBL_BASE}/molecule/{mol['chembl_id']}",
                    params={"format": "json"},
                )
                if resp.status_code == 200:
                    mdata = resp.json()
                    mol["name"] = mdata.get("pref_name") or mol["chembl_id"]
                    mol["max_phase"] = mdata.get("max_phase") or 0
                else:
                    mol["name"] = mol["chembl_id"]
                    mol["max_phase"] = 0
            except Exception:
                mol["name"] = mol["chembl_id"]
                mol["max_phase"] = 0

        # Step e & f: build final ligand list
        ligands = []
        for mol in sorted_mols[:50]:
            # Enrich from top_mols if available
            enriched = next((m for m in top_mols if m["chembl_id"] == mol["chembl_id"]), None)
            name = enriched["name"] if enriched else mol["chembl_id"]
            max_phase = enriched["max_phase"] if enriched else 0

            smiles = mol.get("smiles", "")
            image_url = PUBCHEM_IMG.format(smiles=quote(smiles, safe="")) if smiles else None

            try:
                phase = int(float(max_phase)) if max_phase is not None else 0
            except (ValueError, TypeError):
                phase = 0

            ligands.append({
                "chembl_id": mol["chembl_id"],
                "name": name,
                "smiles": smiles,
                "activity_type": mol["activity_type"],
                "activity_value_nm": mol["value"],
                "clinical_phase": phase,
                "clinical_phase_label": PHASE_LABELS.get(phase, "Preclinical"),
                "image_url": image_url,
            })

        return ligands
