import os

from fastapi import APIRouter, HTTPException

from models.schemas import PocketsRequest, PocketsResponse, PocketResult
from engines.p2rank import P2RankEngine
from services.alphafold import fetch_structure
from services.database import get_cached_pockets, cache_pockets, get_cached_target

# Amino acid classification
_THREE_TO_ONE = {
    "ALA": "A", "ARG": "R", "ASN": "N", "ASP": "D", "CYS": "C",
    "GLN": "Q", "GLU": "E", "GLY": "G", "HIS": "H", "ILE": "I",
    "LEU": "L", "LYS": "K", "MET": "M", "PHE": "F", "PRO": "P",
    "SER": "S", "THR": "T", "TRP": "W", "TYR": "Y", "VAL": "V",
}
_ONE_TO_THREE = {v: k for k, v in _THREE_TO_ONE.items()}
_RESIDUE_TYPES = {
    "A": "hydrophobic", "V": "hydrophobic", "I": "hydrophobic", "L": "hydrophobic",
    "M": "hydrophobic", "F": "aromatic", "W": "aromatic", "P": "hydrophobic",
    "S": "polar", "T": "polar", "N": "polar", "Q": "polar", "C": "polar", "Y": "aromatic",
    "K": "charged_positive", "R": "charged_positive", "H": "charged_positive",
    "D": "charged_negative", "E": "charged_negative",
    "G": "special",
}

STRUCTURE_DIR = os.environ.get("STRUCTURE_CACHE", "/data/structures")

router = APIRouter()
engine = P2RankEngine()


@router.post("/pockets", response_model=PocketsResponse)
async def predict_pockets(req: PocketsRequest):
    # Check Supabase cache
    cached = get_cached_pockets(req.uniprot_id)
    if cached:
        pockets = [
            PocketResult(
                rank=p["rank"],
                score=p["score"],
                center_x=p["center_x"],
                center_y=p["center_y"],
                center_z=p["center_z"],
                residues=p["residues"],
                residue_count=p["residue_count"],
                druggability=p["druggability"],
            )
            for p in cached
        ]
        return PocketsResponse(
            uniprot_id=req.uniprot_id,
            pocket_count=len(pockets),
            pockets=pockets,
        )

    filename = f"{req.uniprot_id}.cif"
    filepath = os.path.join(STRUCTURE_DIR, filename)

    if not os.path.isfile(filepath):
        result = await fetch_structure(req.uniprot_id)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No structure found for {req.uniprot_id}")

    pockets = await engine.predict(filename)

    response = PocketsResponse(
        uniprot_id=req.uniprot_id,
        pocket_count=len(pockets),
        pockets=pockets,
    )

    # Cache in Supabase
    cache_pockets(req.uniprot_id, [p.model_dump() for p in pockets])

    return response


@router.get("/pocket/{uniprot_id}/{rank}/residue_properties")
async def residue_properties(uniprot_id: str, rank: int):
    """Classify pocket residues by chemical type using the target sequence."""
    target = get_cached_target(uniprot_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found. Resolve the target first.")

    sequence = target.get("sequence", "")
    if not sequence:
        raise HTTPException(status_code=404, detail="No sequence available for this target.")

    cached = get_cached_pockets(uniprot_id)
    if not cached:
        raise HTTPException(status_code=404, detail="No pockets found. Run pocket prediction first.")

    pocket = next((p for p in cached if p.get("rank") == rank), None)
    if not pocket:
        raise HTTPException(status_code=404, detail=f"Pocket #{rank} not found.")

    residues_out = []
    for res_name in pocket.get("residues", []):
        # Format: "A_123" (chain_number)
        parts = res_name.split("_")
        if len(parts) < 2:
            continue
        try:
            res_num = int(parts[1])
        except ValueError:
            continue

        # Map residue number to amino acid (1-indexed)
        if 1 <= res_num <= len(sequence):
            one_letter = sequence[res_num - 1]
        else:
            one_letter = "?"

        three_letter = _ONE_TO_THREE.get(one_letter, "UNK")
        res_type = _RESIDUE_TYPES.get(one_letter, "special")

        residues_out.append({
            "name": f"{three_letter}_{res_num}_{parts[0]}",
            "type": res_type,
            "one_letter": one_letter,
            "number": res_num,
            "chain": parts[0],
        })

    return {"residues": residues_out}
