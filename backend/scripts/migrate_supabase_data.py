import os
import sys
import json
import httpx
import psycopg
from dotenv import load_dotenv

# Load env variables from the root .env file which still has SUPABASE config
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# By default, use local docker postgres URL if not defined
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://opendde:opendde@localhost:5432/opendde")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be in the .env file")
    sys.exit(1)

REST_URL = f"{SUPABASE_URL}/rest/v1"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def fetch_table(table_name: str) -> list[dict]:
    results = []
    limit = 1000
    offset = 0
    print(f"Fetching table '{table_name}' from Supabase...")
    while True:
        url = f"{REST_URL}/{table_name}?select=*&limit={limit}&offset={offset}"
        resp = httpx.get(url, headers=HEADERS)
        if resp.status_code != 200:
            print(f"Error fetching {table_name}: {resp.status_code} {resp.text}")
            break
        data = resp.json()
        if not data:
            break
        results.extend(data)
        if len(data) < limit:
            break
        offset += limit
    print(f" -> Fetched {len(results)} rows from {table_name}.")
    return results

def migrate():
    print("Starting data migration...")
    
    tables_order = [
        "targets",
        "pockets",
        "known_ligands",
        "complex_predictions",
        "ai_summaries"
    ]
    
    data_cache = {}
    for table in tables_order:
        data_cache[table] = fetch_table(table)
        
    try:
        conn = psycopg.connect(DATABASE_URL)
        cur = conn.cursor()
    except Exception as e:
        print(f"Failed to connect to local Postgres: {e}")
        print("Please ensure your docker-compose containers are running ('docker compose up -d').")
        sys.exit(1)
        
    try:
        # Disable foreign key checks momentarily if doing complex inserts or just insert in order
        # Since we insert in order, foreign keys should naturally be satisfied.
        
        # 1. TARGETS
        for row in data_cache["targets"]:
            cur.execute("""
                INSERT INTO targets (uniprot_id, name, gene_name, organism, sequence, length, structure_source, plddt_mean, resolved_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (uniprot_id) DO NOTHING
            """, (
                row.get("uniprot_id"), row.get("name"), row.get("gene_name"), row.get("organism"),
                row.get("sequence"), row.get("length"), row.get("structure_source"),
                row.get("plddt_mean"), row.get("resolved_at")
            ))
            
        # 2. POCKETS
        for row in data_cache["pockets"]:
            # Residues field needs serialization back to json string since Postgres expects JSONB
            residues = row.get("residues")
            if not isinstance(residues, str):
                residues = json.dumps(residues)
                
            cur.execute("""
                INSERT INTO pockets (target_id, rank, score, druggability, center_x, center_y, center_z, residues, residue_count, predicted_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (target_id, rank) DO NOTHING
            """, (
                row.get("target_id"), row.get("rank"), row.get("score"), row.get("druggability"),
                row.get("center_x"), row.get("center_y"), row.get("center_z"), residues,
                row.get("residue_count"), row.get("predicted_at")
            ))
            
        # 3. KNOWN LIGANDS
        for row in data_cache["known_ligands"]:
            cur.execute("""
                INSERT INTO known_ligands (target_id, chembl_id, name, smiles, activity_type, activity_value_nm, clinical_phase, clinical_phase_label, image_url, fetched_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                row.get("target_id"), row.get("chembl_id"), row.get("name"), row.get("smiles"),
                row.get("activity_type"), row.get("activity_value_nm"), row.get("clinical_phase"),
                row.get("clinical_phase_label"), row.get("image_url"), row.get("fetched_at")
            ))
            
        # 4. COMPLEX PREDICTIONS
        for row in data_cache["complex_predictions"]:
            # Supabase version had different names mapped internally sometimes
            prediction_id = row.get("prediction_id")
            # Usually target_id was the uniprot_id
            target_id = row.get("uniprot_id") or row.get("target_id")
            
            cur.execute("""
                INSERT INTO complex_predictions (prediction_id, target_id, pocket_rank, ligand_name, ligand_smiles, ligand_ccd, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (prediction_id) DO NOTHING
            """, (
                prediction_id, target_id, row.get("pocket_rank"), row.get("ligand_name"),
                row.get("ligand_smiles"), row.get("ligand_ccd"), row.get("status"), row.get("created_at") or row.get("updated_at")
            ))
            
        # 5. AI SUMMARIES
        for row in data_cache["ai_summaries"]:
            cur.execute("""
                INSERT INTO ai_summaries (target_id, summary_type, summary, generated_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (target_id, summary_type) DO NOTHING
            """, (
                row.get("target_id"), row.get("summary_type"), row.get("summary"), row.get("generated_at")
            ))
        
        conn.commit()
        print("Migration complete! All data successfully moved to your local Postgres database.")
    except Exception as e:
        conn.rollback()
        print(f"An error occurred during data insertion: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
