import httpx

from services import database

UNIPROT_BASE = "https://rest.uniprot.org"


async def _get_interpro_ids(uniprot_id: str, client: httpx.AsyncClient) -> list[str]:
    """Get InterPro cross-references for a protein, sorted most-specific-first."""
    resp = await client.get(
        f"{UNIPROT_BASE}/uniprotkb/{uniprot_id}",
        params={"fields": "xref_interpro", "format": "json"},
    )
    if resp.status_code != 200:
        return []
    data = resp.json()
    xrefs = data.get("uniProtKBCrossReferences", [])
    ids = [x["id"] for x in xrefs if x.get("database") == "InterPro"]
    # Reverse so more specific (later-listed) domains come first
    return list(reversed(ids))


async def _search_by_interpro(
    interpro_id: str,
    exclude_id: str,
    client: httpx.AsyncClient,
    organism_id: int = 9606,
    size: int = 10,
) -> list[dict]:
    """Search UniProt for reviewed human proteins sharing an InterPro domain."""
    resp = await client.get(
        f"{UNIPROT_BASE}/uniprotkb/search",
        params={
            "query": f"(xref:interpro-{interpro_id}) AND (reviewed:true) AND (organism_id:{organism_id})",
            "fields": "accession,protein_name,gene_names,organism_name,length",
            "format": "json",
            "size": str(size + 1),  # +1 to allow filtering self
        },
    )
    if resp.status_code != 200:
        return []
    results = resp.json().get("results", [])

    targets = []
    for r in results:
        acc = r.get("primaryAccession", "")
        if acc == exclude_id:
            continue
        prot_desc = r.get("proteinDescription", {})
        rec_name = prot_desc.get("recommendedName", {})
        name = rec_name.get("fullName", {}).get("value", acc)
        genes = r.get("genes", [])
        gene_name = genes[0].get("geneName", {}).get("value", "") if genes else None
        organism = r.get("organism", {}).get("scientificName", "")
        length = r.get("sequence", {}).get("length", 0)

        targets.append({
            "uniprot_id": acc,
            "name": name,
            "gene_name": gene_name,
            "organism": organism,
            "length": length,
        })
        if len(targets) >= size:
            break
    return targets


def _check_in_opendde(uniprot_ids: list[str]) -> set[str]:
    """Check which UniProt IDs have already been explored in OpenDDE."""
    if not database.pool or not uniprot_ids:
        return set()
    try:
        with database.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT uniprot_id FROM targets WHERE uniprot_id = ANY(%s)",
                    (uniprot_ids,)
                )
                return {row[0] for row in cur.fetchall()}
    except Exception as e:
        print(f"Error checking similar targets in db: {e}")
        return set()


async def find_similar_targets(uniprot_id: str, limit: int = 5) -> list[dict]:
    """Find proteins similar to the given target using InterPro domain families."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        interpro_ids = await _get_interpro_ids(uniprot_id, client)
        if not interpro_ids:
            return []

        # Try progressively broader InterPro domains until we get enough results
        results: list[dict] = []
        tried = set()
        for ipr_id in interpro_ids:
            if ipr_id in tried:
                continue
            tried.add(ipr_id)
            hits = await _search_by_interpro(ipr_id, uniprot_id, client, size=limit)
            for hit in hits:
                if hit["uniprot_id"] not in {r["uniprot_id"] for r in results}:
                    results.append(hit)
            if len(results) >= limit:
                break

        results = results[:limit]

        # Enrich with OpenDDE status
        if results:
            explored = _check_in_opendde([r["uniprot_id"] for r in results])
            for r in results:
                r["in_opendde"] = r["uniprot_id"] in explored

    return results
