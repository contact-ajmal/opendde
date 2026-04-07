import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from rdkit import Chem
from rdkit.Chem import Descriptors, Lipinski, AllChem, DataStructs

app = FastAPI(title="RDKit Properties Service")


class SmilesInput(BaseModel):
    smiles: str


class SimilarityInput(BaseModel):
    smiles_a: str
    smiles_b: str


class BatchInput(BaseModel):
    smiles_list: list[str]


def calculate_properties(smiles: str) -> dict:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Invalid SMILES: {smiles}")

    mw = Descriptors.MolWt(mol)
    logp = Descriptors.MolLogP(mol)
    hbd = Lipinski.NumHDonors(mol)
    hba = Lipinski.NumHAcceptors(mol)
    tpsa = Descriptors.TPSA(mol)
    rotatable = Lipinski.NumRotatableBonds(mol)
    rings = Lipinski.RingCount(mol)
    aromatic_rings = Descriptors.NumAromaticRings(mol)

    violations = sum([mw > 500, logp > 5, hbd > 5, hba > 10])

    if violations == 0:
        verdict = "Drug-like"
    elif violations == 1:
        verdict = "Drug-like (1 violation)"
    else:
        verdict = f"Non-drug-like ({violations} violations)"

    return {
        "smiles": smiles,
        "molecular_weight": round(mw, 2),
        "logp": round(logp, 2),
        "hbd": hbd,
        "hba": hba,
        "tpsa": round(tpsa, 2),
        "rotatable_bonds": rotatable,
        "num_rings": rings,
        "num_aromatic_rings": aromatic_rings,
        "lipinski_violations": violations,
        "lipinski_pass": violations <= 1,
        "druglikeness_verdict": verdict,
    }


def calculate_similarity(smiles_a: str, smiles_b: str) -> float:
    mol_a = Chem.MolFromSmiles(smiles_a)
    mol_b = Chem.MolFromSmiles(smiles_b)
    if mol_a is None or mol_b is None:
        raise ValueError("Invalid SMILES")

    fp_a = AllChem.GetMorganFingerprintAsBitVect(mol_a, 2, nBits=2048)
    fp_b = AllChem.GetMorganFingerprintAsBitVect(mol_b, 2, nBits=2048)
    return round(DataStructs.TanimotoSimilarity(fp_a, fp_b), 4)


@app.post("/properties")
async def get_properties(body: SmilesInput):
    try:
        return calculate_properties(body.smiles)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/similarity")
async def get_similarity(body: SimilarityInput):
    try:
        sim = calculate_similarity(body.smiles_a, body.smiles_b)
        return {"tanimoto_similarity": sim}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/batch_properties")
async def get_batch_properties(body: BatchInput):
    results = []
    for smiles in body.smiles_list[:100]:  # cap at 100
        try:
            results.append(calculate_properties(smiles))
        except ValueError:
            results.append({"smiles": smiles, "error": "Invalid SMILES"})
    return results


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)
