import os
import subprocess
import tempfile
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from rdkit import Chem
from rdkit.Chem import AllChem
from meeko import MoleculePreparation, PDBQTMolecule, RDKitMolCreate
from vina import Vina

app = FastAPI()

class DockRequest(BaseModel):
    receptor_cif: str
    ligand_smiles: str
    center: List[float]
    size: List[float]
    exhaustiveness: int = 8

class DockResponse(BaseModel):
    docked_pdb: str
    poses: List[dict]

def embed_smiles(smiles: str) -> str:
    """Generate a 3D RDKit Mol block from SMILES."""
    mol = Chem.MolFromSmiles(smiles)
    if not mol:
        raise ValueError("Invalid SMILES")
    mol = Chem.AddHs(mol)
    AllChem.EmbedMolecule(mol, AllChem.ETKDGv3())
    try:
        AllChem.MMFFOptimizeMolecule(mol)
    except Exception:
        pass # Optimization might fail, ETKDG is usually fine
    return Chem.MolToMolBlock(mol)

@app.post("/dock", response_model=DockResponse)
def compute_docking(req: DockRequest):
    try:
        if len(req.center) != 3 or len(req.size) != 3:
            raise ValueError("Center and size must be lists of 3 floats")

        with tempfile.TemporaryDirectory() as tmpdir:
            # 1. Prepare Ligand (SMILES -> 3D RDKit -> PDBQT)
            mol_block = embed_smiles(req.ligand_smiles)
            mol = Chem.MolFromMolBlock(mol_block)
            
            preparator = MoleculePreparation()
            preparator.prepare(mol)
            ligand_pdbqt_string = preparator.write_pdbqt_string()
            
            ligand_path = os.path.join(tmpdir, "ligand.pdbqt")
            with open(ligand_path, "w") as f:
                f.write(ligand_pdbqt_string)

            # 2. Prepare Receptor (CIF -> OpenBabel -> PDBQT)
            receptor_cif_path = os.path.join(tmpdir, "receptor.cif")
            with open(receptor_cif_path, "w") as f:
                f.write(req.receptor_cif)
            
            receptor_pdbqt_path = os.path.join(tmpdir, "receptor.pdbqt")
            subprocess.run(
                ["obabel", "-icif", receptor_cif_path, "-opdbqt", "-O", receptor_pdbqt_path, "-xr"],
                check=True,
                capture_output=True
            )
            
            # also create a PDB version of the receptor for final concatenation
            receptor_pdb_path = os.path.join(tmpdir, "receptor.pdb")
            subprocess.run(
                ["obabel", "-icif", receptor_cif_path, "-opdb", "-O", receptor_pdb_path],
                check=True,
                capture_output=True
            )

            # 3. AutoDock Vina Execution
            v = Vina(sf_name='vina')
            v.set_receptor(receptor_pdbqt_path)
            v.set_ligand_from_file(ligand_path)
            v.compute_vina_maps(center=req.center, box_size=req.size)
            
            # Run docking!
            v.dock(exhaustiveness=req.exhaustiveness, n_poses=5)
            
            output_pdbqt = os.path.join(tmpdir, "out.pdbqt")
            v.write_poses(output_pdbqt, n_poses=5, energy_range=3.0)
            
            # Read energies
            poses_energies = v.energies(n_poses=5)
            
            # 4. Convert docked ligand to PDB and combine with receptor
            # PDBQT to SDF/PDB using OpenBabel
            docked_ligand_pdb = os.path.join(tmpdir, "ligand_docked.pdb")
            subprocess.run(
                ["obabel", "-ipdbqt", output_pdbqt, "-opdb", "-O", docked_ligand_pdb, "-m"],
                check=True,
                capture_output=True # This produces ligand_docked1.pdb etc
            )
            
            # Simply combine the receptor PDB with the best pose (ligand_docked1.pdb)
            best_pose_path = os.path.join(tmpdir, "ligand_docked1.pdb")
            if not os.path.exists(best_pose_path):
                # if OB doesn't split it the same way or there's only 1 pose
                best_pose_path = docked_ligand_pdb
            
            with open(best_pose_path, "r") as f:
                # Strip out standard 'HEADER' or 'COMPND' records from ligand pdb to just get ATOM/HETATM lines
                ligand_lines = [line for line in f.readlines() if line.startswith("ATOM") or line.startswith("HETATM") or line.startswith("CONECT")]
            
            # Combine
            with open(receptor_pdb_path, "r") as f:
                receptor_pdb_str = f.read()
            combined_pdb = receptor_pdb_str + "\n" + "".join(ligand_lines)

            # Format the output metrics
            out_poses = []
            for i, energy in enumerate(poses_energies):
                out_poses.append({
                    "rank": i + 1,
                    "affinity_kcal_mol": energy[0],
                })

            return DockResponse(docked_pdb=combined_pdb, poses=out_poses)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
