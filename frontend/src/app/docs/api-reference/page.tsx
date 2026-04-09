'use client';

import { useState } from 'react';

const metadata = { title: 'API Reference' };

interface Endpoint {
  method: string;
  path: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
  curl?: string;
}

interface EndpointGroup {
  title: string;
  endpoints: Endpoint[];
}

const apiGroups: EndpointGroup[] = [
  {
    title: 'Targets',
    endpoints: [
      {
        method: 'POST',
        path: '/target/resolve',
        description: 'Resolve a protein target from UniProt by ID, name, or gene name. Creates the target in the database if not already present.',
        requestBody: `{
  "query": "P00533"
}`,
        responseBody: `{
  "uniprot_id": "P00533",
  "name": "Epidermal growth factor receptor",
  "gene_name": "EGFR",
  "organism": "Homo sapiens",
  "length": 1210,
  "structure_file": "P00533.cif"
}`,
        curl: `curl -X POST http://localhost:8000/api/v1/target/resolve \\
  -H "Content-Type: application/json" \\
  -d '{"query": "P00533"}'`,
      },
      {
        method: 'GET',
        path: '/structures/{filename}',
        description: 'Serve a protein structure file (CIF format). Returns the file with Cache-Control headers (24h).',
        curl: `curl http://localhost:8000/api/v1/structures/P00533.cif -o P00533.cif`,
      },
      {
        method: 'GET',
        path: '/target/{uniprot_id}/similar',
        description: 'Find proteins similar to the given target. Returns up to 5 related targets.',
        responseBody: `{
  "similar_targets": [
    {
      "uniprot_id": "P04626",
      "name": "Receptor tyrosine-protein kinase erbB-2",
      "gene_name": "ERBB2",
      "organism": "Homo sapiens",
      "length": 1255,
      "in_opendde": true
    }
  ]
}`,
        curl: `curl http://localhost:8000/api/v1/target/P00533/similar?limit=5`,
      },
      {
        method: 'GET',
        path: '/target/{uniprot_id}/safety',
        description: 'Fetch safety profile data from Open Targets for a given protein.',
        curl: `curl http://localhost:8000/api/v1/target/P00533/safety`,
      },
      {
        method: 'GET',
        path: '/search?q={query}',
        description: 'Search for targets and ligands. Returns recent targets if query is empty.',
        responseBody: `{
  "targets": [
    { "uniprot_id": "P00533", "name": "EGFR", "gene_name": "EGFR", "organism": "Homo sapiens" }
  ],
  "ligands": [
    { "chembl_id": "CHEMBL553", "name": "Erlotinib", "target_id": "P00533" }
  ]
}`,
        curl: `curl "http://localhost:8000/api/v1/search?q=EGFR"`,
      },
    ],
  },
  {
    title: 'Pockets',
    endpoints: [
      {
        method: 'POST',
        path: '/pockets',
        description: 'Predict binding pockets for a protein using P2Rank.',
        requestBody: `{
  "uniprot_id": "P00533"
}`,
        responseBody: `{
  "pockets": [
    {
      "rank": 1,
      "score": 0.89,
      "residues": ["LEU718", "VAL726", "ALA743", ...],
      "center": [12.3, 45.6, 78.9]
    }
  ]
}`,
        curl: `curl -X POST http://localhost:8000/api/v1/pockets \\
  -H "Content-Type: application/json" \\
  -d '{"uniprot_id": "P00533"}'`,
      },
      {
        method: 'GET',
        path: '/pocket/{uniprot_id}/{rank}/residue_properties',
        description: 'Get chemical properties (hydrophobicity, charge, etc.) of residues in a specific pocket.',
        curl: `curl http://localhost:8000/api/v1/pocket/P00533/1/residue_properties`,
      },
      {
        method: 'GET',
        path: '/pockets/{uniprot_id}/composition',
        description: 'Get composition statistics (hydrophobic/polar/charged/aromatic ratios) for all pockets.',
        curl: `curl http://localhost:8000/api/v1/pockets/P00533/composition`,
      },
    ],
  },
  {
    title: 'Ligands',
    endpoints: [
      {
        method: 'GET',
        path: '/ligands/{uniprot_id}',
        description: 'Fetch all known ligands from ChEMBL for a target. Returns compounds with bioactivity data.',
        responseBody: `{
  "ligands": [
    {
      "chembl_id": "CHEMBL553",
      "name": "Erlotinib",
      "smiles": "C=Cc1cc2c(Nc3ccc(OC)c(OC)c3)ncnc2cc1OCCOC",
      "activity_type": "IC50",
      "activity_value_nm": 2.0,
      "phase": 4
    }
  ]
}`,
        curl: `curl http://localhost:8000/api/v1/ligands/P00533`,
      },
    ],
  },
  {
    title: 'Predictions',
    endpoints: [
      {
        method: 'POST',
        path: '/complex/prepare',
        description: 'Generate an AlphaFold 3 job JSON for protein-ligand complex prediction.',
        requestBody: `{
  "uniprot_id": "P00533",
  "ligand_smiles": "C=Cc1cc2c(Nc3ccc(OC)c(OC)c3)ncnc2cc1OCCOC",
  "ligand_name": "Erlotinib"
}`,
        curl: `curl -X POST http://localhost:8000/api/v1/complex/prepare \\
  -H "Content-Type: application/json" \\
  -d '{"uniprot_id":"P00533","ligand_smiles":"...","ligand_name":"Erlotinib"}'`,
      },
      {
        method: 'POST',
        path: '/complex/upload',
        description: 'Upload a predicted complex structure (CIF or ZIP) from AlphaFold Server.',
        curl: `curl -X POST http://localhost:8000/api/v1/complex/upload \\
  -F "file=@complex_result.cif" \\
  -F "prediction_id=abc123"`,
      },
      {
        method: 'GET',
        path: '/complex/{prediction_id}',
        description: 'Get prediction status and details for a specific complex prediction.',
        curl: `curl http://localhost:8000/api/v1/complex/abc123`,
      },
      {
        method: 'GET',
        path: '/target/{uniprot_id}/predictions',
        description: 'List all complex predictions for a target.',
        curl: `curl http://localhost:8000/api/v1/target/P00533/predictions`,
      },
    ],
  },
  {
    title: 'Antibody',
    endpoints: [
      {
        method: 'POST',
        path: '/antibody/predict',
        description: 'Predict antibody 3D structure from heavy and light chain sequences using ImmuneBuilder.',
        requestBody: `{
  "heavy_chain": "EVQLVESGGGLVQPGGSLRLSCAASGFTFS...",
  "light_chain": "DIQMTQSPSSLSASVGDRVTITCRASQSIS..."
}`,
        curl: `curl -X POST http://localhost:8000/api/v1/antibody/predict \\
  -H "Content-Type: application/json" \\
  -d '{"heavy_chain":"EVQL...","light_chain":"DIQM..."}'`,
      },
      {
        method: 'GET',
        path: '/antibody/structures/{filename}',
        description: 'Serve an antibody structure file (PDB format).',
        curl: `curl http://localhost:8000/api/v1/antibody/structures/antibody_abc123.pdb`,
      },
    ],
  },
  {
    title: 'Properties',
    endpoints: [
      {
        method: 'GET',
        path: '/properties/{smiles_encoded}',
        description: 'Get molecular properties (MW, LogP, HBD, HBA, TPSA, rotatable bonds, Lipinski violations) for a SMILES string.',
        responseBody: `{
  "molecular_weight": 393.44,
  "logp": 3.17,
  "hbd": 1,
  "hba": 7,
  "tpsa": 74.73,
  "rotatable_bonds": 10,
  "lipinski_violations": 0
}`,
        curl: `curl "http://localhost:8000/api/v1/properties/C%3DCc1cc2c..."`,
      },
      {
        method: 'POST',
        path: '/properties/batch',
        description: 'Get properties for multiple SMILES strings at once.',
        requestBody: `{
  "smiles_list": ["CCO", "c1ccccc1", "CC(=O)O"]
}`,
        curl: `curl -X POST http://localhost:8000/api/v1/properties/batch \\
  -H "Content-Type: application/json" \\
  -d '{"smiles_list":["CCO","c1ccccc1"]}'`,
      },
      {
        method: 'POST',
        path: '/validate',
        description: 'Validate SMILES syntax using RDKit.',
        requestBody: `{ "smiles": "CCO" }`,
        responseBody: `{ "valid": true }`,
        curl: `curl -X POST http://localhost:8000/api/v1/validate \\
  -H "Content-Type: application/json" \\
  -d '{"smiles":"CCO"}'`,
      },
      {
        method: 'POST',
        path: '/depict',
        description: 'Generate a 2D molecule visualization as PNG image.',
        requestBody: `{ "smiles": "c1ccccc1", "width": 300, "height": 300 }`,
        curl: `curl -X POST http://localhost:8000/api/v1/depict \\
  -H "Content-Type: application/json" \\
  -d '{"smiles":"c1ccccc1"}' -o molecule.png`,
      },
    ],
  },
  {
    title: 'Reports',
    endpoints: [
      {
        method: 'GET',
        path: '/report/{uniprot_id}',
        description: 'Generate a comprehensive druggability assessment report (JSON).',
        curl: `curl http://localhost:8000/api/v1/report/P00533`,
      },
      {
        method: 'GET',
        path: '/report/{uniprot_id}/pdf',
        description: 'Generate a PDF druggability report for download.',
        curl: `curl http://localhost:8000/api/v1/report/P00533/pdf -o report.pdf`,
      },
    ],
  },
  {
    title: 'Assistant',
    endpoints: [
      {
        method: 'POST',
        path: '/assistant/chat',
        description: 'Chat with the Claude AI assistant for interactive drug design advice. Returns a streaming response.',
        requestBody: `{
  "message": "What makes EGFR a good drug target?",
  "context": { "uniprot_id": "P00533" }
}`,
        curl: `curl -X POST http://localhost:8000/api/v1/assistant/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message":"What makes EGFR a good drug target?","context":{"uniprot_id":"P00533"}}'`,
      },
      {
        method: 'POST',
        path: '/assistant/pocket-summary',
        description: 'Generate an AI analysis of pocket druggability (cached for repeated requests).',
        requestBody: `{
  "uniprot_id": "P00533",
  "pocket_rank": 1
}`,
        curl: `curl -X POST http://localhost:8000/api/v1/assistant/pocket-summary \\
  -H "Content-Type: application/json" \\
  -d '{"uniprot_id":"P00533","pocket_rank":1}'`,
      },
      {
        method: 'POST',
        path: '/assistant/suggest-ligands',
        description: 'Generate 3 suggested ligand modifications for a given pocket (cached).',
        curl: `curl -X POST http://localhost:8000/api/v1/assistant/suggest-ligands \\
  -H "Content-Type: application/json" \\
  -d '{"uniprot_id":"P00533","pocket_rank":1}'`,
      },
    ],
  },
  {
    title: 'Analytics & Export',
    endpoints: [
      {
        method: 'GET',
        path: '/stats',
        description: 'Get summary statistics: explored targets, total pockets, ligands, predictions.',
        curl: `curl http://localhost:8000/api/v1/stats`,
      },
      {
        method: 'GET',
        path: '/analytics',
        description: 'Get comprehensive analytics dashboard data including distributions and timelines.',
        curl: `curl http://localhost:8000/api/v1/analytics`,
      },
      {
        method: 'GET',
        path: '/export/pockets/{uniprot_id}',
        description: 'Export pockets data as CSV file.',
        curl: `curl http://localhost:8000/api/v1/export/pockets/P00533 -o pockets.csv`,
      },
      {
        method: 'GET',
        path: '/export/ligands/{uniprot_id}',
        description: 'Export ligands data as CSV file.',
        curl: `curl http://localhost:8000/api/v1/export/ligands/P00533 -o ligands.csv`,
      },
      {
        method: 'POST',
        path: '/activity-cliffs/{uniprot_id}',
        description: 'Detect activity cliffs: ligand pairs with high structural similarity but large activity differences.',
        responseBody: `{
  "cliffs": [
    {
      "ligand_a": { "chembl_id": "CHEMBL1", "name": "Drug A", "activity_nm": 10 },
      "ligand_b": { "chembl_id": "CHEMBL2", "name": "Drug B", "activity_nm": 5000 },
      "similarity": 0.85,
      "activity_ratio": 500
    }
  ]
}`,
        curl: `curl -X POST http://localhost:8000/api/v1/activity-cliffs/P00533`,
      },
    ],
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-500/20 text-blue-400',
    POST: 'bg-emerald-500/20 text-emerald-400',
    HEAD: 'bg-amber-500/20 text-amber-400',
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-bold ${colors[method] || 'bg-gray-500/20 text-gray-400'}`}>
      {method}
    </span>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-hover)] transition-colors"
      >
        <MethodBadge method={ep.method} />
        <code className="text-sm font-medium text-foreground">{ep.path}</code>
        <span className="ml-auto text-xs text-muted-2">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-4 space-y-4">
          <p className="text-sm text-muted">{ep.description}</p>
          {ep.requestBody && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-2">Request body</div>
              <pre className="text-xs"><code>{ep.requestBody}</code></pre>
            </div>
          )}
          {ep.responseBody && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-2">Response</div>
              <pre className="text-xs"><code>{ep.responseBody}</code></pre>
            </div>
          )}
          {ep.curl && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-2">Example</div>
              <pre className="text-xs"><code>{ep.curl}</code></pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApiReferencePage() {
  return (
    <>
      <h1>API reference</h1>

      <p>
        All endpoints are served at <code>http://localhost:8000/api/v1</code>. The API returns JSON
        responses with appropriate HTTP status codes.
      </p>

      <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm text-muted">
          <strong>Base URL:</strong>{' '}
          <code>http://localhost:8000/api/v1</code>
        </p>
        <p className="mt-1 text-sm text-muted">
          <strong>Content-Type:</strong>{' '}
          <code>application/json</code> (for POST requests)
        </p>
        <p className="mt-1 text-sm text-muted">
          <strong>Total endpoints:</strong> 35
        </p>
      </div>

      {apiGroups.map((group) => (
        <div key={group.title} className="mt-10">
          <h2 id={group.title.toLowerCase().replace(/\s+/g, '-')}>{group.title}</h2>
          <div className="mt-3 space-y-2">
            {group.endpoints.map((ep) => (
              <EndpointCard key={`${ep.method}-${ep.path}`} ep={ep} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
