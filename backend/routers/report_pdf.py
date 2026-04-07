from io import BytesIO
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

from routers.reports import _build_report
from services.database import get_cached_target, get_cached_pockets, get_cached_ligands

router = APIRouter()

WIDTH, HEIGHT = A4


def _verdict_color(verdict: str) -> colors.Color:
    if "Highly" in verdict:
        return colors.HexColor("#059669")
    if verdict == "Druggable":
        return colors.HexColor("#0ea5e9")
    if "Moderately" in verdict:
        return colors.HexColor("#d97706")
    return colors.HexColor("#dc2626")


def _build_pdf(report: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "Title2", parent=styles["Title"], fontSize=20, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "Subtitle", parent=styles["Normal"], fontSize=11,
        textColor=colors.HexColor("#6b7280"), spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        "SectionHead", parent=styles["Heading2"], fontSize=14,
        spaceBefore=16, spaceAfter=8, textColor=colors.HexColor("#111827"),
    ))
    styles.add(ParagraphStyle(
        "Body", parent=styles["Normal"], fontSize=10, leading=14,
    ))
    styles.add(ParagraphStyle(
        "Footer", parent=styles["Normal"], fontSize=8,
        textColor=colors.HexColor("#9ca3af"), alignment=1,
    ))

    story = []

    # ── Header ──
    target = report["target"]
    story.append(Paragraph("OpenDDE Druggability Report", styles["Title2"]))
    story.append(Paragraph(
        f"{target['name']} ({target['uniprot_id']}) &mdash; {target['organism']}",
        styles["Subtitle"],
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
    story.append(Spacer(1, 6 * mm))

    # ── Section 1: Target summary ──
    story.append(Paragraph("1. Target Summary", styles["SectionHead"]))
    info_data = [
        ["Name", target["name"]],
        ["UniProt ID", target["uniprot_id"]],
        ["Organism", target["organism"]],
        ["Length", f"{target['length']} amino acids"],
        ["Structure source", report["structure"]["source"]],
    ]
    if report["structure"]["plddt_mean"] is not None:
        info_data.append(["pLDDT (mean)", f"{report['structure']['plddt_mean']:.1f}"])

    t = Table(info_data, colWidths=[45 * mm, 120 * mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#111827")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 4 * mm))

    # ── Section 2: Druggability verdict ──
    story.append(Paragraph("2. Druggability Assessment", styles["SectionHead"]))
    assess = report["druggability_assessment"]
    vc = _verdict_color(assess["verdict"])
    story.append(Paragraph(
        f'<font color="{vc.hexval()}" size="16"><b>{assess["verdict"]}</b></font>'
        f'&nbsp;&nbsp;<font size="10">Score: {assess["score"]}</font>',
        styles["Body"],
    ))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(assess["reasoning"], styles["Body"]))
    story.append(Spacer(1, 4 * mm))

    # ── Section 3: Pocket analysis ──
    story.append(Paragraph("3. Pocket Analysis", styles["SectionHead"]))
    if report["pockets"]:
        pocket_header = ["Rank", "Score", "Druggability", "Residues"]
        pocket_rows = [pocket_header]
        for p in report["pockets"][:10]:
            pocket_rows.append([
                str(p["rank"]),
                f"{p['score']:.1f}",
                f"{p['druggability'] * 100:.0f}%",
                str(p["residue_count"]),
            ])
        pt = Table(pocket_rows, colWidths=[25 * mm, 35 * mm, 40 * mm, 35 * mm])
        pt.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ]))
        story.append(pt)
    else:
        story.append(Paragraph("No pockets detected.", styles["Body"]))
    story.append(Spacer(1, 4 * mm))

    # ── Section 4: Ligand landscape ──
    story.append(Paragraph("4. Ligand Landscape", styles["SectionHead"]))
    ls = report["ligand_summary"]
    summary_data = [
        ["Total known ligands", str(ls["total_known"])],
        ["Approved drugs", str(ls["approved_drugs"])],
        ["Phase 3", str(ls["phase_3"])],
        ["Best IC50", f"{ls['best_ic50_nm']:.1f} nM" if ls["best_ic50_nm"] else "N/A"],
        ["Chemical series (est.)", str(ls["chemical_series_count"])],
    ]
    lt = Table(summary_data, colWidths=[50 * mm, 40 * mm])
    lt.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(lt)
    story.append(Spacer(1, 4 * mm))

    # ── Section 5: Top 5 ligands ──
    story.append(Paragraph("5. Top Ligands by Activity", styles["SectionHead"]))
    if report["top_ligands"]:
        lig_header = ["Name", "Activity", "Value (nM)", "Phase"]
        lig_rows = [lig_header]
        for l in report["top_ligands"]:
            val = l.get("activity_value_nm", 0)
            lig_rows.append([
                l.get("name", "Unknown"),
                l.get("activity_type", ""),
                f"{val:.1f}" if val else "N/A",
                l.get("clinical_phase_label", "Preclinical"),
            ])
        lgt = Table(lig_rows, colWidths=[50 * mm, 30 * mm, 35 * mm, 40 * mm])
        lgt.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(lgt)
    else:
        story.append(Paragraph("No known ligands.", styles["Body"]))
    story.append(Spacer(1, 8 * mm))

    # ── Footer ──
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db")))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        f"Generated by OpenDDE — Open Drug Design Engine &bull; {report['generated_at'][:19]}Z",
        styles["Footer"],
    ))

    doc.build(story)
    return buf.getvalue()


@router.get("/report/{uniprot_id}/pdf")
async def get_report_pdf(uniprot_id: str):
    target = get_cached_target(uniprot_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target not found. Resolve the target first.")

    pockets = get_cached_pockets(uniprot_id) or []
    ligands = get_cached_ligands(uniprot_id) or []
    report = _build_report(target, pockets, ligands)

    pdf_bytes = _build_pdf(report)
    filename = f"opendde_report_{uniprot_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
