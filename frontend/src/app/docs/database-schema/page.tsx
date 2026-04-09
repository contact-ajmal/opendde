import Link from 'next/link';

export const metadata = { title: 'Database Schema' };

export default function DatabaseSchemaPage() {
  return (
    <>
      <h1>Database schema</h1>

      <p>
        OpenDDE uses <strong>Supabase</strong> (PostgreSQL) for persistent storage. The schema
        tracks explored targets, their pockets, known ligands, and complex predictions.
      </p>

      <h2 id="tables">Core tables</h2>

      <h3>targets</h3>
      <pre><code>{`CREATE TABLE targets (
  uniprot_id    TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  gene_name     TEXT,
  organism      TEXT NOT NULL,
  length        INTEGER NOT NULL,
  sequence      TEXT,
  structure_file TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);`}</code></pre>

      <h3>pockets</h3>
      <pre><code>{`CREATE TABLE pockets (
  id            SERIAL PRIMARY KEY,
  uniprot_id    TEXT REFERENCES targets(uniprot_id),
  rank          INTEGER NOT NULL,
  score         FLOAT NOT NULL,
  residues      JSONB NOT NULL,
  center_x      FLOAT,
  center_y      FLOAT,
  center_z      FLOAT,
  UNIQUE(uniprot_id, rank)
);`}</code></pre>

      <h3>ligands</h3>
      <pre><code>{`CREATE TABLE ligands (
  id              SERIAL PRIMARY KEY,
  chembl_id       TEXT NOT NULL,
  uniprot_id      TEXT REFERENCES targets(uniprot_id),
  name            TEXT,
  smiles          TEXT,
  activity_type   TEXT,
  activity_value_nm FLOAT,
  phase           INTEGER,
  UNIQUE(chembl_id, uniprot_id)
);`}</code></pre>

      <h3>predictions</h3>
      <pre><code>{`CREATE TABLE predictions (
  id              TEXT PRIMARY KEY,
  uniprot_id      TEXT REFERENCES targets(uniprot_id),
  ligand_chembl_id TEXT,
  ligand_smiles   TEXT,
  status          TEXT DEFAULT 'pending',
  structure_file  TEXT,
  confidence      JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);`}</code></pre>

      <h2 id="relationships">Relationships</h2>

      <ul>
        <li>A <strong>target</strong> has many <strong>pockets</strong> (1:N)</li>
        <li>A <strong>target</strong> has many <strong>ligands</strong> (1:N)</li>
        <li>A <strong>target</strong> has many <strong>predictions</strong> (1:N)</li>
      </ul>

      <p><Link href="/docs/api-reference">Next: API reference &rarr;</Link></p>
    </>
  );
}
