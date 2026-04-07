import re

import httpx
from fastapi import HTTPException

from models.schemas import TargetInfo

UNIPROT_ID_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9]{5}$")


async def resolve_target(query: str) -> TargetInfo:
    async with httpx.AsyncClient(timeout=15.0) as client:
        if UNIPROT_ID_PATTERN.match(query):
            resp = await client.get(
                f"https://rest.uniprot.org/uniprotkb/{query}?format=json"
            )
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail=f"UniProt ID {query} not found")
            resp.raise_for_status()
            entry = resp.json()
        else:
            resp = await client.get(
                "https://rest.uniprot.org/uniprotkb/search",
                params={
                    "query": f"gene_exact:{query} AND organism_id:9606",
                    "format": "json",
                    "size": "1",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if not results:
                raise HTTPException(status_code=404, detail=f"No human gene found for '{query}'")
            entry = results[0]

        uniprot_id = entry["primaryAccession"]

        name = "Unknown"
        protein_desc = entry.get("proteinDescription", {})
        rec_name = protein_desc.get("recommendedName")
        if rec_name:
            name = rec_name.get("fullName", {}).get("value", "Unknown")
        elif protein_desc.get("submissionNames"):
            name = protein_desc["submissionNames"][0].get("fullName", {}).get("value", "Unknown")

        gene_name = None
        genes = entry.get("genes", [])
        if genes:
            gene_name = genes[0].get("geneName", {}).get("value")

        organism = entry.get("organism", {}).get("scientificName", "Unknown")
        sequence = entry.get("sequence", {}).get("value", "")
        length = entry.get("sequence", {}).get("length", len(sequence))

        return TargetInfo(
            uniprot_id=uniprot_id,
            name=name,
            gene_name=gene_name,
            organism=organism,
            sequence=sequence,
            length=length,
        )
