CREATE TABLE targets (
    uniprot_id VARCHAR PRIMARY KEY,
    name VARCHAR,
    gene_name VARCHAR,
    organism VARCHAR,
    sequence TEXT,
    length INTEGER,
    structure_source VARCHAR,
    plddt_mean REAL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE pockets (
    target_id VARCHAR REFERENCES targets(uniprot_id) ON DELETE CASCADE,
    rank INTEGER,
    score REAL,
    druggability REAL,
    center_x REAL,
    center_y REAL,
    center_z REAL,
    residues JSONB,
    residue_count INTEGER,
    predicted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (target_id, rank)
);

CREATE TABLE known_ligands (
    id SERIAL PRIMARY KEY,
    target_id VARCHAR REFERENCES targets(uniprot_id) ON DELETE CASCADE,
    chembl_id VARCHAR,
    name VARCHAR,
    smiles TEXT,
    activity_type VARCHAR,
    activity_value_nm REAL,
    clinical_phase INTEGER,
    clinical_phase_label VARCHAR,
    image_url VARCHAR,
    fetched_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE complex_predictions (
    prediction_id VARCHAR PRIMARY KEY,
    target_id VARCHAR,
    pocket_rank INTEGER,
    ligand_name VARCHAR,
    ligand_smiles TEXT,
    ligand_ccd VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ai_summaries (
    target_id VARCHAR REFERENCES targets(uniprot_id) ON DELETE CASCADE,
    summary_type VARCHAR,
    summary TEXT,
    generated_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (target_id, summary_type)
);
