import csv
import io

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from services.database import get_cached_pockets, get_cached_ligands

router = APIRouter()


@router.get("/export/pockets/{uniprot_id}")
async def export_pockets_csv(uniprot_id: str):
    cached = get_cached_pockets(uniprot_id)
    if not cached:
        raise HTTPException(status_code=404, detail="No cached pockets found. Run pocket prediction first.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["rank", "score", "druggability", "center_x", "center_y", "center_z", "residue_count", "residues"])

    for p in cached:
        residues = p.get("residues", [])
        if isinstance(residues, list):
            residues_str = " ".join(residues)
        else:
            residues_str = str(residues)
        writer.writerow([
            p["rank"], p["score"], p.get("druggability", ""),
            p.get("center_x", ""), p.get("center_y", ""), p.get("center_z", ""),
            p.get("residue_count", ""), residues_str,
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={uniprot_id}_pockets.csv"},
    )


@router.get("/export/ligands/{uniprot_id}")
async def export_ligands_csv(uniprot_id: str):
    cached = get_cached_ligands(uniprot_id)
    if not cached:
        raise HTTPException(status_code=404, detail="No cached ligands found. Fetch ligands first.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["chembl_id", "name", "smiles", "activity_type", "activity_value_nm", "clinical_phase", "clinical_phase_label"])

    for lig in cached:
        writer.writerow([
            lig.get("chembl_id", ""), lig.get("name", ""), lig.get("smiles", ""),
            lig.get("activity_type", ""), lig.get("activity_value_nm", ""),
            lig.get("clinical_phase", ""), lig.get("clinical_phase_label", ""),
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={uniprot_id}_ligands.csv"},
    )
