class AF3JobBuilder:
    @staticmethod
    def build_job(
        protein_sequence: str,
        ligand_ccd: str | None = None,
        ligand_smiles: str | None = None,
        job_name: str = "opendde_prediction",
    ) -> dict:
        sequences = [
            {
                "proteinChain": {
                    "sequence": protein_sequence,
                    "count": 1,
                }
            }
        ]

        if ligand_ccd:
            sequences.append({
                "ligand": {
                    "ccdCodes": [ligand_ccd],
                    "count": 1,
                }
            })
        elif ligand_smiles:
            sequences.append({
                "ligand": {
                    "smiles": ligand_smiles,
                    "count": 1,
                }
            })

        return {
            "name": job_name,
            "sequences": sequences,
            "modelSeeds": [1, 2, 3],
            "dialect": "alphafold3",
            "version": 1,
        }
