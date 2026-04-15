import math
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


def _classify_residues(sequence: str, residue_names: list[str]) -> dict:
    """Classify residues and return type ratios."""
    counts: dict[str, int] = {}
    total = 0
    for res_name in residue_names:
        parts = res_name.split("_")
        if len(parts) < 2:
            continue
        try:
            res_num = int(parts[1])
        except ValueError:
            continue
        if 1 <= res_num <= len(sequence):
            one_letter = sequence[res_num - 1]
        else:
            continue
        rtype = _RESIDUE_TYPES.get(one_letter, "special")
        counts[rtype] = counts.get(rtype, 0) + 1
        total += 1
    if total == 0:
        return {"hydrophobic": 0, "polar": 0, "charged": 0, "aromatic": 0}
    return {
        "hydrophobic": round(counts.get("hydrophobic", 0) / total, 3),
        "polar": round(counts.get("polar", 0) / total, 3),
        "charged": round(
            (counts.get("charged_positive", 0) + counts.get("charged_negative", 0)) / total, 3
        ),
        "aromatic": round(counts.get("aromatic", 0) / total, 3),
    }


@router.get("/pockets/{uniprot_id}/composition")
async def pockets_composition(uniprot_id: str):
    """Return composition stats for all pockets of a target."""
    target = get_cached_target(uniprot_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found.")

    sequence = target.get("sequence", "")
    if not sequence:
        raise HTTPException(status_code=404, detail="No sequence available.")

    cached = get_cached_pockets(uniprot_id)
    if not cached:
        raise HTTPException(status_code=404, detail="No pockets found.")

    results = []
    for p in sorted(cached, key=lambda x: x.get("rank", 0)):
        residues = p.get("residues", [])
        comp = _classify_residues(sequence, residues)
        results.append({
            "rank": p.get("rank"),
            "score": p.get("score", 0),
            "druggability": p.get("druggability", 0),
            "residue_count": p.get("residue_count", len(residues)),
            "hydrophobic_ratio": comp["hydrophobic"],
            "polar_ratio": comp["polar"],
            "charged_ratio": comp["charged"],
            "aromatic_ratio": comp["aromatic"],
        })

    return {"pockets": results}


# Donor / acceptor side-chain classification (simplified)
_HBOND_DONORS = {"S", "T", "N", "Q", "Y", "W", "K", "R", "H", "C"}
_HBOND_ACCEPTORS = {"S", "T", "N", "Q", "D", "E", "Y", "H"}


def _estimate_pocket_geometry(
    pocket: dict, structure_path: str | None
) -> dict:
    """Estimate volume, surface area, and depth from pocket residue positions.

    Uses the pocket center + residue count heuristic when we don't have per-atom
    coordinates readily available (fast path).  If we later add BioPython/scipy
    we can switch to a convex-hull calculation.
    """
    residues = pocket.get("residues", [])
    n = len(residues)
    cx = pocket.get("center_x", 0.0)
    cy = pocket.get("center_y", 0.0)
    cz = pocket.get("center_z", 0.0)

    # Parse residue positions from their identifiers to get a rough radius
    # Each residue contributes ~125 Å³ on average; this approximation is
    # consistent with published pocket-volume estimation heuristics.
    est_volume = n * 125.0

    # Surface ≈ 4πr² where r = (3V / 4π)^(1/3)
    r = (3 * est_volume / (4 * math.pi)) ** (1 / 3)
    est_surface = 4 * math.pi * r * r

    # Depth ≈ diameter = 2r (rough proxy — real depth needs cavity analysis)
    est_depth = 2 * r

    # Enclosure ratio: heuristic based on druggability (more druggable = more
    # enclosed).  P2Rank druggability already incorporates enclosure-like features.
    druggability = pocket.get("druggability", 0.5)
    enclosure = min(0.95, 0.3 + druggability * 0.6)

    return {
        "volume_angstrom3": round(est_volume, 1),
        "surface_area_angstrom2": round(est_surface, 1),
        "depth_angstrom": round(est_depth, 1),
        "enclosure_ratio": round(enclosure, 2),
        "center": {"x": cx, "y": cy, "z": cz},
    }


@router.get("/pocket/{uniprot_id}/{rank}/properties")
async def pocket_properties(uniprot_id: str, rank: int):
    """Return detailed physical and chemical properties for a pocket."""
    target = get_cached_target(uniprot_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found.")

    sequence = target.get("sequence", "")
    if not sequence:
        raise HTTPException(status_code=404, detail="No sequence available.")

    cached = get_cached_pockets(uniprot_id)
    if not cached:
        raise HTTPException(status_code=404, detail="No pockets found.")

    pocket = next((p for p in cached if p.get("rank") == rank), None)
    
    # Fallback: if rank 0 requested but missing, try the first available pocket
    if not pocket and rank == 0 and cached:
        pocket = sorted(cached, key=lambda x: x.get("rank", 1))[0]

    if not pocket:
        raise HTTPException(status_code=404, detail=f"Pocket #{rank} not found.")

    residue_names = pocket.get("residues", [])

    # Classify residues
    residues_by_type: dict[str, list[str]] = {
        "hydrophobic": [],
        "polar": [],
        "charged_positive": [],
        "charged_negative": [],
        "aromatic": [],
    }
    donors = 0
    acceptors = 0
    total = 0

    for res_name in residue_names:
        parts = res_name.split("_")
        if len(parts) < 2:
            continue
        try:
            res_num = int(parts[1])
        except ValueError:
            continue
        if 1 <= res_num <= len(sequence):
            one = sequence[res_num - 1]
        else:
            continue

        rtype = _RESIDUE_TYPES.get(one, "special")
        if rtype in residues_by_type:
            residues_by_type[rtype].append(res_name)
        elif rtype == "special":
            residues_by_type["polar"].append(res_name)  # GLY → polar bucket
        total += 1

        if one in _HBOND_DONORS:
            donors += 1
        if one in _HBOND_ACCEPTORS:
            acceptors += 1

    # Ratios
    t = total or 1
    hydrophobic_ratio = round(len(residues_by_type["hydrophobic"]) / t, 3)
    polar_ratio = round(len(residues_by_type["polar"]) / t, 3)
    charged_ratio = round(
        (len(residues_by_type["charged_positive"]) + len(residues_by_type["charged_negative"])) / t, 3
    )
    aromatic_ratio = round(len(residues_by_type["aromatic"]) / t, 3)

    # Geometry estimates
    geo = _estimate_pocket_geometry(pocket, None)

    return {
        "rank": rank,
        "score": pocket.get("score", 0),
        "druggability": pocket.get("druggability", 0),
        "residue_count": total,
        "volume_angstrom3": geo["volume_angstrom3"],
        "surface_area_angstrom2": geo["surface_area_angstrom2"],
        "depth_angstrom": geo["depth_angstrom"],
        "enclosure_ratio": geo["enclosure_ratio"],
        "center": geo["center"],
        "hydrophobic_ratio": hydrophobic_ratio,
        "polar_ratio": polar_ratio,
        "charged_ratio": charged_ratio,
        "aromatic_ratio": aromatic_ratio,
        "hbond_donors": donors,
        "hbond_acceptors": acceptors,
        "residues_by_type": residues_by_type,
    }
