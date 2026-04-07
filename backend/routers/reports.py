from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from services.database import (
    get_cached_target,
    get_cached_pockets,
    get_cached_ligands,
)

router = APIRouter()


def _druggability_verdict(pockets: list[dict], ligands: list[dict]) -> dict:
    """Compute druggability verdict from pockets and ligands."""
    if not pockets or all(p.get("score", 0) <= 2 for p in pockets):
        return {
            "verdict": "Undruggable",
            "score": 0.0,
            "reasoning": "No pockets predicted with score >2.",
        }

    top = max(pockets, key=lambda p: p.get("druggability", 0))
    top_drug = top.get("druggability", 0)
    n_ligands = len(ligands)
    approved = sum(1 for l in ligands if l.get("clinical_phase", 0) >= 4)

    if top_drug >= 0.7 and n_ligands >= 10 and approved >= 1:
        verdict = "Highly druggable"
    elif top_drug >= 0.5 and n_ligands >= 5:
        verdict = "Druggable"
    elif top_drug >= 0.3 or n_ligands >= 3:
        verdict = "Moderately druggable"
    else:
        verdict = "Challenging"

    score = round(min(1.0, (top_drug * 0.6) + (min(n_ligands, 50) / 50 * 0.3) + (min(approved, 5) / 5 * 0.1)), 2)

    parts = [f"Top pocket scores {top.get('score', 0):.1f} with {top_drug * 100:.0f}% druggability."]
    if n_ligands:
        phases = set(l.get("clinical_phase", 0) for l in ligands if l.get("clinical_phase", 0) > 0)
        parts.append(f"{n_ligands} known active compounds across {len(phases)} clinical phase(s).")
    if approved:
        parts.append(f"{approved} approved drug(s).")

    return {"verdict": verdict, "score": score, "reasoning": " ".join(parts)}


def _build_report(target: dict, pockets: list[dict], ligands: list[dict]) -> dict:
    assessment = _druggability_verdict(pockets, ligands)

    pocket_summaries = []
    for p in sorted(pockets, key=lambda x: x.get("rank", 0)):
        pocket_summaries.append({
            "rank": p.get("rank"),
            "score": round(p.get("score", 0), 2),
            "druggability": round(p.get("druggability", 0), 4),
            "residue_count": p.get("residue_count", 0),
            "known_ligand_count": len(ligands),  # all ligands apply to the target
        })

    approved_drugs = sum(1 for l in ligands if l.get("clinical_phase", 0) >= 4)
    phase_3 = sum(1 for l in ligands if l.get("clinical_phase", 0) == 3)
    ic50_vals = [l["activity_value_nm"] for l in ligands if l.get("activity_value_nm")]
    best_ic50 = round(min(ic50_vals), 2) if ic50_vals else None

    # Estimate chemical series by counting unique first-4-char SMILES prefixes
    smiles_set = set()
    for l in ligands:
        s = l.get("smiles", "")
        if len(s) >= 4:
            smiles_set.add(s[:4])
    series_count = len(smiles_set)

    sorted_ligands = sorted(ligands, key=lambda l: l.get("activity_value_nm", 1e9))
    top_5 = []
    for l in sorted_ligands[:5]:
        top_5.append({
            "chembl_id": l.get("chembl_id"),
            "name": l.get("name"),
            "smiles": l.get("smiles"),
            "activity_type": l.get("activity_type"),
            "activity_value_nm": l.get("activity_value_nm"),
            "clinical_phase": l.get("clinical_phase", 0),
            "clinical_phase_label": l.get("clinical_phase_label", "Preclinical"),
        })

    return {
        "target": {
            "name": target.get("name"),
            "uniprot_id": target.get("uniprot_id"),
            "organism": target.get("organism"),
            "length": target.get("length"),
            "gene_name": target.get("gene_name"),
        },
        "structure": {
            "source": target.get("structure_source", "unknown"),
            "plddt_mean": target.get("plddt_mean"),
        },
        "druggability_assessment": assessment,
        "pockets": pocket_summaries,
        "ligand_summary": {
            "total_known": len(ligands),
            "approved_drugs": approved_drugs,
            "phase_3": phase_3,
            "best_ic50_nm": best_ic50,
            "chemical_series_count": series_count,
        },
        "top_ligands": top_5,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/report/{uniprot_id}")
async def get_report(uniprot_id: str):
    target = get_cached_target(uniprot_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found. Resolve the target first.")

    pockets = get_cached_pockets(uniprot_id) or []
    ligands = get_cached_ligands(uniprot_id) or []

    return _build_report(target, pockets, ligands)
