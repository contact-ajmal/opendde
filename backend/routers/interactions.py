"""Protein-ligand interaction calculation from complex CIF structures."""

import math
import os
import re
from typing import Any

from fastapi import APIRouter, HTTPException

# Optional heavy dependencies — graceful degradation if missing
try:
    import numpy as np

    _HAS_NUMPY = True
except ImportError:
    _HAS_NUMPY = False

try:
    from Bio.PDB import MMCIFParser  # type: ignore

    _HAS_BIOPYTHON = True
except ImportError:
    _HAS_BIOPYTHON = False


STRUCTURE_DIR = os.environ.get("STRUCTURE_CACHE", "/data/structures")
COMPLEXES_DIR = os.path.join(STRUCTURE_DIR, "complexes")

router = APIRouter()

# ---------------------------------------------------------------------------
# Shared lookup helper (mirrors predictions.py pattern)
# ---------------------------------------------------------------------------

# Late import to avoid circular deps at module level
_predictions: dict | None = None


def _get_prediction(prediction_id: str) -> dict | None:
    """Look up a prediction from in-memory store, then fall back to Supabase."""
    global _predictions
    if _predictions is None:
        try:
            from routers.predictions import _predictions as mem_store
            _predictions = mem_store
        except ImportError:
            _predictions = {}

    if prediction_id in _predictions:
        return _predictions[prediction_id]

    try:
        from services.database import get_prediction as db_get_prediction

        row = db_get_prediction(prediction_id)
        if row:
            return row
    except Exception:
        pass

    return None


# ---------------------------------------------------------------------------
# Constants for interaction detection
# ---------------------------------------------------------------------------

STANDARD_RESIDUES = {
    "ALA", "ARG", "ASN", "ASP", "CYS", "GLN", "GLU", "GLY", "HIS", "ILE",
    "LEU", "LYS", "MET", "PHE", "PRO", "SER", "THR", "TRP", "TYR", "VAL",
    # Also treat water as non-ligand
    "HOH", "WAT",
}

HBOND_DONORS = {"N", "O", "S"}
HBOND_ACCEPTORS = {"N", "O", "S", "F"}

HYDROPHOBIC_ELEMENTS = {"C"}

AROMATIC_RESIDUES = {
    "PHE": ["CG", "CD1", "CD2", "CE1", "CE2", "CZ"],
    "TYR": ["CG", "CD1", "CD2", "CE1", "CE2", "CZ"],
    "TRP": ["CG", "CD1", "CD2", "NE1", "CE2", "CE3", "CZ2", "CZ3", "CH2"],
    "HIS": ["CG", "ND1", "CD2", "CE1", "NE2"],
}

POSITIVE_RESIDUES = {"ARG": ["NH1", "NH2", "NE"], "LYS": ["NZ"]}
NEGATIVE_RESIDUES = {"ASP": ["OD1", "OD2"], "GLU": ["OE1", "OE2"]}


# ---------------------------------------------------------------------------
# Geometry helpers (require numpy)
# ---------------------------------------------------------------------------


def _dist(a, b):
    """Euclidean distance between two 3-vectors."""
    return float(np.linalg.norm(np.array(a) - np.array(b)))


def _angle(a, b, c):
    """Angle in degrees at vertex b formed by points a-b-c."""
    ba = np.array(a) - np.array(b)
    bc = np.array(c) - np.array(b)
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-9)
    return float(np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0))))


def _centroid(coords):
    """Centroid of a list of (x, y, z) tuples."""
    arr = np.array(coords)
    return arr.mean(axis=0)


def _ring_normal(coords):
    """Approximate normal of a ring defined by coords."""
    c = _centroid(coords)
    arr = np.array(coords) - c
    # Use SVD – the last right-singular vector is the normal
    _, _, vt = np.linalg.svd(arr)
    return vt[-1]


def _atom_label(residue, atom):
    """Format: RESNAME_RESNUM_CHAIN:ATOMNAME"""
    resname = residue.get_resname().strip()
    resnum = residue.get_id()[1]
    chain = residue.get_parent().get_id()
    return f"{resname}_{resnum}_{chain}:{atom.get_name().strip()}"


def _residue_label(residue):
    resname = residue.get_resname().strip()
    resnum = residue.get_id()[1]
    chain = residue.get_parent().get_id()
    return f"{resname}_{resnum}_{chain}"


# ---------------------------------------------------------------------------
# Full BioPython-based interaction analysis
# ---------------------------------------------------------------------------


def _analyse_interactions(cif_path: str) -> dict[str, Any]:
    """Parse CIF with BioPython and compute detailed interactions."""
    parser = MMCIFParser(QUIET=True)
    structure = parser.get_structure("complex", cif_path)
    model = structure[0]

    # Separate ligand atoms from protein atoms
    ligand_atoms = []
    protein_atoms = []

    for chain in model:
        for residue in chain:
            resname = residue.get_resname().strip()
            hetflag = residue.get_id()[0]
            if resname in STANDARD_RESIDUES:
                for atom in residue:
                    protein_atoms.append(atom)
            elif hetflag.startswith("H_") or hetflag == "W" or resname not in STANDARD_RESIDUES:
                # Non-standard residue → treat as ligand (skip water)
                if resname in ("HOH", "WAT"):
                    continue
                for atom in residue:
                    ligand_atoms.append(atom)

    if not ligand_atoms:
        raise HTTPException(
            status_code=422,
            detail="No ligand (non-protein, non-water) atoms found in the CIF file.",
        )

    # Pre-compute coordinate arrays for speed
    lig_coords = np.array([a.get_vector().get_array() for a in ligand_atoms])
    prot_coords = np.array([a.get_vector().get_array() for a in protein_atoms])

    # Build distance matrix (ligand x protein)
    # shape: (n_lig, n_prot)
    diff = lig_coords[:, None, :] - prot_coords[None, :, :]
    dist_matrix = np.sqrt((diff ** 2).sum(axis=2))

    # ------------------------------------------------------------------
    # 1. Hydrogen bonds (donor-acceptor within 3.5 A, angle > 120)
    # ------------------------------------------------------------------
    hydrogen_bonds: list[dict] = []
    hbond_cutoff = 3.5

    for i, latom in enumerate(ligand_atoms):
        lelem = latom.element.strip().upper()
        if lelem not in HBOND_DONORS and lelem not in HBOND_ACCEPTORS:
            continue
        for j, patom in enumerate(protein_atoms):
            if dist_matrix[i, j] > hbond_cutoff:
                continue
            pelem = patom.element.strip().upper()
            # Need one donor and one acceptor
            is_pair = (lelem in HBOND_DONORS and pelem in HBOND_ACCEPTORS) or (
                lelem in HBOND_ACCEPTORS and pelem in HBOND_DONORS
            )
            if not is_pair:
                continue

            distance = float(dist_matrix[i, j])

            # Approximate angle using neighbouring bonded atom as third point.
            # We use the closest heavy atom to the donor as the "pre-donor" atom.
            donor = latom if lelem in HBOND_DONORS else patom
            donor_idx = i if donor is latom else j
            donor_coords = donor.get_vector().get_array()

            # Find closest other atom in the same residue as donor for angle
            parent_residue = donor.get_parent()
            best_third = None
            best_d = 999.0
            for sibling in parent_residue:
                if sibling is donor:
                    continue
                d = _dist(sibling.get_vector().get_array(), donor_coords)
                if d < best_d:
                    best_d = d
                    best_third = sibling

            angle = None
            if best_third is not None:
                acceptor = patom if donor is latom else latom
                angle = _angle(
                    best_third.get_vector().get_array(),
                    donor_coords,
                    acceptor.get_vector().get_array(),
                )
                if angle < 120.0:
                    continue

            hydrogen_bonds.append(
                {
                    "ligand_atom": latom.get_name().strip(),
                    "protein_atom": _atom_label(patom.get_parent(), patom),
                    "distance": round(distance, 2),
                    "angle": round(angle, 1) if angle is not None else None,
                }
            )

    # ------------------------------------------------------------------
    # 2. Hydrophobic contacts (C-C within 4.0 A between hydrophobic groups)
    # ------------------------------------------------------------------
    hydrophobic_contacts: list[dict] = []
    hydrophobic_cutoff = 4.0

    for i, latom in enumerate(ligand_atoms):
        if latom.element.strip().upper() not in HYDROPHOBIC_ELEMENTS:
            continue
        for j, patom in enumerate(protein_atoms):
            if dist_matrix[i, j] > hydrophobic_cutoff:
                continue
            if patom.element.strip().upper() not in HYDROPHOBIC_ELEMENTS:
                continue
            hydrophobic_contacts.append(
                {
                    "ligand_atom": latom.get_name().strip(),
                    "protein_atom": _atom_label(patom.get_parent(), patom),
                    "distance": round(float(dist_matrix[i, j]), 2),
                }
            )

    # ------------------------------------------------------------------
    # 3. Aromatic ring detection + pi-pi stacking
    # ------------------------------------------------------------------
    pi_stacking: list[dict] = []

    # Collect protein aromatic rings
    protein_rings: list[tuple[str, list]] = []  # (label, coords)
    seen_res = set()
    for patom in protein_atoms:
        res = patom.get_parent()
        res_id = res.get_full_id()
        resname = res.get_resname().strip()
        if resname not in AROMATIC_RESIDUES or res_id in seen_res:
            continue
        seen_res.add(res_id)
        ring_atom_names = AROMATIC_RESIDUES[resname]
        ring_coords = []
        for ratom in res:
            if ratom.get_name().strip() in ring_atom_names:
                ring_coords.append(ratom.get_vector().get_array())
        if len(ring_coords) >= 4:
            protein_rings.append((_residue_label(res), ring_coords))

    # Detect ligand aromatic rings (simple heuristic: groups of 5-6 connected
    # C/N atoms forming a roughly planar ring). We approximate by looking for
    # clusters of sp2-like atoms.
    ligand_ring_coords: list[tuple[str, list]] = []
    lig_c_n = [
        (a, a.get_vector().get_array())
        for a in ligand_atoms
        if a.element.strip().upper() in ("C", "N")
    ]
    # Simple approach: any group of 5-6 atoms mutually within 2.5 A of centroid
    if len(lig_c_n) >= 5:
        coords_arr = np.array([c for _, c in lig_c_n])
        used = set()
        for idx in range(len(lig_c_n)):
            if idx in used:
                continue
            dists = np.linalg.norm(coords_arr - coords_arr[idx], axis=1)
            nearby = np.where(dists < 3.0)[0]
            if len(nearby) >= 5:
                ring_set = nearby[:6]
                ring_c = [coords_arr[k] for k in ring_set]
                label = f"ring_{len(ligand_ring_coords) + 1}"
                ligand_ring_coords.append((label, ring_c))
                used.update(ring_set.tolist())

    for lring_label, lring in ligand_ring_coords:
        lc = _centroid(lring)
        ln = _ring_normal(lring)
        for pring_label, pring in protein_rings:
            pc = _centroid(pring)
            pn = _ring_normal(pring)
            d = _dist(lc, pc)
            if d > 5.5:
                continue
            # Angle between normals
            cos_a = abs(np.dot(ln, pn) / (np.linalg.norm(ln) * np.linalg.norm(pn) + 1e-9))
            if cos_a > 0.8:
                stype = "parallel"
            elif cos_a < 0.3:
                stype = "T-shaped"
            else:
                continue  # not a clear stacking geometry
            pi_stacking.append(
                {
                    "ligand_ring": lring_label,
                    "protein_ring": pring_label,
                    "distance": round(d, 2),
                    "type": stype,
                }
            )

    # ------------------------------------------------------------------
    # 4. Salt bridges (opposite charges within 4.0 A)
    # ------------------------------------------------------------------
    salt_bridges: list[dict] = []
    salt_cutoff = 4.0

    # Ligand charged atoms (heuristic: N with 3+ bonds → positive, O in carboxyl → negative)
    lig_positive = [a for a in ligand_atoms if a.element.strip().upper() == "N"]
    lig_negative = [a for a in ligand_atoms if a.element.strip().upper() == "O"]

    # Protein charged groups
    prot_positive_atoms = []
    prot_negative_atoms = []
    for patom in protein_atoms:
        res = patom.get_parent()
        resname = res.get_resname().strip()
        aname = patom.get_name().strip()
        if resname in POSITIVE_RESIDUES and aname in POSITIVE_RESIDUES[resname]:
            prot_positive_atoms.append(patom)
        if resname in NEGATIVE_RESIDUES and aname in NEGATIVE_RESIDUES[resname]:
            prot_negative_atoms.append(patom)

    # Lig positive ↔ Prot negative
    for latom in lig_positive:
        lc = latom.get_vector().get_array()
        for patom in prot_negative_atoms:
            pc = patom.get_vector().get_array()
            d = _dist(lc, pc)
            if d <= salt_cutoff:
                salt_bridges.append(
                    {
                        "ligand_atom": latom.get_name().strip(),
                        "protein_atom": _atom_label(patom.get_parent(), patom),
                        "distance": round(d, 2),
                    }
                )

    # Lig negative ↔ Prot positive
    for latom in lig_negative:
        lc = latom.get_vector().get_array()
        for patom in prot_positive_atoms:
            pc = patom.get_vector().get_array()
            d = _dist(lc, pc)
            if d <= salt_cutoff:
                salt_bridges.append(
                    {
                        "ligand_atom": latom.get_name().strip(),
                        "protein_atom": _atom_label(patom.get_parent(), patom),
                        "distance": round(d, 2),
                    }
                )

    # ------------------------------------------------------------------
    # 5. Cation-pi (positive charge to aromatic centroid within 6.0 A)
    # ------------------------------------------------------------------
    cation_pi: list[dict] = []
    cation_pi_cutoff = 6.0

    # Ligand cation → protein ring
    for latom in lig_positive:
        lc = latom.get_vector().get_array()
        for pring_label, pring in protein_rings:
            pc = _centroid(pring)
            d = _dist(lc, pc)
            if d <= cation_pi_cutoff:
                cation_pi.append(
                    {
                        "ligand_atom": latom.get_name().strip(),
                        "protein_ring": pring_label,
                        "distance": round(d, 2),
                    }
                )

    # Protein cation → ligand ring
    for patom in prot_positive_atoms:
        pc = patom.get_vector().get_array()
        for lring_label, lring in ligand_ring_coords:
            lc_center = _centroid(lring)
            d = _dist(pc, lc_center)
            if d <= cation_pi_cutoff:
                cation_pi.append(
                    {
                        "protein_atom": _atom_label(patom.get_parent(), patom),
                        "ligand_ring": lring_label,
                        "distance": round(d, 2),
                    }
                )

    # ------------------------------------------------------------------
    # Collect contact residues
    # ------------------------------------------------------------------
    contact_cutoff = 5.0
    contact_residues = set()
    close_mask = dist_matrix.min(axis=0) < contact_cutoff
    for j in range(len(protein_atoms)):
        if close_mask[j]:
            contact_residues.add(_residue_label(protein_atoms[j].get_parent()))

    # Build ligand atom list
    ligand_atom_list = [
        {
            "name": a.get_name().strip(),
            "element": a.element.strip(),
            "x": round(float(a.get_vector()[0]), 3),
            "y": round(float(a.get_vector()[1]), 3),
            "z": round(float(a.get_vector()[2]), 3),
        }
        for a in ligand_atoms
    ]

    return {
        "ligand_atoms": ligand_atom_list,
        "hydrogen_bonds": hydrogen_bonds,
        "hydrophobic_contacts": hydrophobic_contacts,
        "pi_stacking": pi_stacking,
        "salt_bridges": salt_bridges,
        "cation_pi": cation_pi,
        "contact_residues": sorted(contact_residues),
    }


# ---------------------------------------------------------------------------
# Simple text-based CIF parser (no BioPython required)
# ---------------------------------------------------------------------------

_SIMPLE_HBOND_ELEMENTS = {"N", "O", "S", "F"}
_SIMPLE_HYDROPHOBIC_ELEMENTS = {"C"}
_SIMPLE_AROMATIC_ELEMENTS = {"C", "N"}


def _parse_cif_text(cif_path: str) -> list[dict]:
    """Parse _atom_site records from a CIF file using plain text parsing.

    Returns a list of dicts with keys:
        group, atom_name, element, resname, chain, resnum, x, y, z
    """
    atoms: list[dict] = []

    with open(cif_path, "r") as fh:
        lines = fh.readlines()

    # Find the _atom_site loop header and column order
    in_atom_site = False
    columns: list[str] = []
    data_started = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("_atom_site."):
            in_atom_site = True
            col_name = stripped.split(".")[1].split()[0]
            columns.append(col_name)
            data_started = False
            continue

        if in_atom_site and not data_started:
            if stripped.startswith("_") or stripped.startswith("#") or stripped == "":
                if stripped.startswith("_atom_site."):
                    col_name = stripped.split(".")[1].split()[0]
                    columns.append(col_name)
                elif stripped.startswith("_") or stripped == "#":
                    # End of atom_site block
                    in_atom_site = False
                continue
            data_started = True

        if in_atom_site and data_started:
            if stripped.startswith("_") or stripped.startswith("#") or stripped.startswith("loop_") or stripped == "":
                in_atom_site = False
                continue

            tokens = stripped.split()
            if len(tokens) < len(columns):
                continue

            record: dict[str, str] = {}
            for idx, col in enumerate(columns):
                if idx < len(tokens):
                    record[col] = tokens[idx]

            # Map to our normalised dict
            group = record.get("group_PDB", "ATOM")
            atom_name = record.get("auth_atom_id") or record.get("label_atom_id", "?")
            element = record.get("type_symbol", atom_name[0] if atom_name else "?")
            resname = record.get("auth_comp_id") or record.get("label_comp_id", "UNK")
            chain = record.get("auth_asym_id") or record.get("label_asym_id", "?")
            resnum = record.get("auth_seq_id") or record.get("label_seq_id", "0")

            try:
                x = float(record.get("Cartn_x", 0))
                y = float(record.get("Cartn_y", 0))
                z = float(record.get("Cartn_z", 0))
            except ValueError:
                continue

            atoms.append(
                {
                    "group": group,
                    "atom_name": atom_name.strip('"').strip("'"),
                    "element": element.strip('"').strip("'").upper(),
                    "resname": resname.strip('"').strip("'"),
                    "chain": chain.strip('"').strip("'"),
                    "resnum": resnum.strip('"').strip("'"),
                    "x": x,
                    "y": y,
                    "z": z,
                }
            )

    return atoms


def _simple_distance(a: dict, b: dict) -> float:
    dx = a["x"] - b["x"]
    dy = a["y"] - b["y"]
    dz = a["z"] - b["z"]
    return math.sqrt(dx * dx + dy * dy + dz * dz)


def _simple_atom_label(atom: dict) -> str:
    return f"{atom['resname']}_{atom['resnum']}_{atom['chain']}:{atom['atom_name']}"


def _simple_residue_label(atom: dict) -> str:
    return f"{atom['resname']}_{atom['resnum']}_{atom['chain']}"


def _analyse_interactions_simple(cif_path: str) -> dict[str, Any]:
    """Heuristic distance-only interaction analysis without BioPython."""
    all_atoms = _parse_cif_text(cif_path)
    if not all_atoms:
        raise HTTPException(status_code=422, detail="Could not parse any atoms from the CIF file.")

    # Separate ligand from protein
    ligand_atoms = [
        a for a in all_atoms
        if a["resname"] not in STANDARD_RESIDUES
        and a["group"] in ("HETATM", "ATOM")
    ]
    protein_atoms = [
        a for a in all_atoms
        if a["resname"] in STANDARD_RESIDUES and a["resname"] not in ("HOH", "WAT")
    ]

    # If no HETATM ligand found, try treating non-standard residues as ligand
    if not ligand_atoms:
        ligand_atoms = [
            a for a in all_atoms
            if a["resname"] not in STANDARD_RESIDUES
        ]

    if not ligand_atoms:
        raise HTTPException(
            status_code=422,
            detail="No ligand atoms found in the CIF file.",
        )

    # Find protein atoms within 5 A of any ligand atom
    nearby_cutoff = 5.0
    nearby_protein: list[dict] = []
    for patom in protein_atoms:
        for latom in ligand_atoms:
            if _simple_distance(patom, latom) <= nearby_cutoff:
                nearby_protein.append(patom)
                break

    # Classify contacts
    hydrogen_bonds: list[dict] = []
    hydrophobic_contacts: list[dict] = []
    aromatic_contacts: list[dict] = []
    contact_residues: set[str] = set()

    for latom in ligand_atoms:
        for patom in nearby_protein:
            d = _simple_distance(latom, patom)
            contact_residues.add(_simple_residue_label(patom))

            # H-bond heuristic: N/O/S/F within 3.5 A
            if d <= 3.5:
                if (
                    latom["element"] in _SIMPLE_HBOND_ELEMENTS
                    and patom["element"] in _SIMPLE_HBOND_ELEMENTS
                ):
                    hydrogen_bonds.append(
                        {
                            "ligand_atom": latom["atom_name"],
                            "protein_atom": _simple_atom_label(patom),
                            "distance": round(d, 2),
                        }
                    )
                    continue

            # Hydrophobic heuristic: C-C within 4.0 A
            if d <= 4.0:
                if (
                    latom["element"] in _SIMPLE_HYDROPHOBIC_ELEMENTS
                    and patom["element"] in _SIMPLE_HYDROPHOBIC_ELEMENTS
                ):
                    hydrophobic_contacts.append(
                        {
                            "ligand_atom": latom["atom_name"],
                            "protein_atom": _simple_atom_label(patom),
                            "distance": round(d, 2),
                        }
                    )
                    continue

            # Aromatic heuristic: C/N of aromatic residues within 5.0 A
            if d <= 5.0:
                if (
                    latom["element"] in _SIMPLE_AROMATIC_ELEMENTS
                    and patom["element"] in _SIMPLE_AROMATIC_ELEMENTS
                    and patom["resname"] in AROMATIC_RESIDUES
                ):
                    aromatic_contacts.append(
                        {
                            "ligand_atom": latom["atom_name"],
                            "protein_atom": _simple_atom_label(patom),
                            "distance": round(d, 2),
                        }
                    )

    ligand_atom_list = [
        {
            "name": a["atom_name"],
            "element": a["element"],
            "x": round(a["x"], 3),
            "y": round(a["y"], 3),
            "z": round(a["z"], 3),
        }
        for a in ligand_atoms
    ]

    return {
        "ligand_atoms": ligand_atom_list,
        "hydrogen_bonds": hydrogen_bonds,
        "hydrophobic_contacts": hydrophobic_contacts,
        "aromatic_contacts": aromatic_contacts,
        "contact_residues": sorted(contact_residues),
        "method": "simple_distance_heuristic",
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/complex/{prediction_id}/interactions")
async def calculate_interactions(prediction_id: str):
    """Calculate detailed protein-ligand interactions from a complex CIF.

    Requires BioPython and numpy.
    """
    if not _HAS_BIOPYTHON:
        raise HTTPException(
            status_code=501,
            detail=(
                "BioPython is not installed. Install it with: pip install biopython. "
                "Alternatively, use the /complex/{prediction_id}/interactions/simple "
                "endpoint which works without BioPython."
            ),
        )
    if not _HAS_NUMPY:
        raise HTTPException(
            status_code=501,
            detail="numpy is not installed. Install it with: pip install numpy",
        )

    pred = _get_prediction(prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")

    cif_path = os.path.join(COMPLEXES_DIR, f"{prediction_id}.cif")
    if not os.path.isfile(cif_path):
        raise HTTPException(
            status_code=404,
            detail=f"Complex CIF file not found at {cif_path}",
        )

    try:
        result = _analyse_interactions(cif_path)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating interactions: {exc}",
        )

    return {"prediction_id": prediction_id, **result}


@router.get("/complex/{prediction_id}/interactions/simple")
async def calculate_interactions_simple(prediction_id: str):
    """Calculate heuristic protein-ligand interactions using text-based CIF parsing.

    Does NOT require BioPython — uses distance-only heuristics.
    """
    pred = _get_prediction(prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")

    cif_path = os.path.join(COMPLEXES_DIR, f"{prediction_id}.cif")
    if not os.path.isfile(cif_path):
        raise HTTPException(
            status_code=404,
            detail=f"Complex CIF file not found at {cif_path}",
        )

    try:
        result = _analyse_interactions_simple(cif_path)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating interactions: {exc}",
        )

    return {"prediction_id": prediction_id, **result}
