import Link from 'next/link';

export const metadata = { title: 'Engine Swap Layer' };

export default function EngineSwapPage() {
  return (
    <>
      <h1>Engine swap layer</h1>

      <p>
        OpenDDE is designed with a modular &ldquo;engine swap&rdquo; architecture. Each
        computational tool is accessed through a standardized adapter interface, making it easy
        to replace any engine without changing the rest of the system.
      </p>

      <h2 id="why">Why engine swapping?</h2>

      <p>
        Computational biology moves fast. New tools emerge regularly (Boltz-2, Chai-1, ESMFold).
        Rather than being locked into specific tools, OpenDDE lets you swap engines as better
        alternatives become available.
      </p>

      <h2 id="adapter-pattern">The adapter pattern</h2>

      <p>Each engine type defines an abstract interface:</p>

      <pre><code>{`# backend/engines/base.py
from abc import ABC, abstractmethod

class PocketEngine(ABC):
    @abstractmethod
    async def predict(self, structure_path: str) -> list[dict]:
        """Predict binding pockets from a structure file."""
        ...

class StructureEngine(ABC):
    @abstractmethod
    async def predict_complex(self, protein_seq: str, ligand_smiles: str) -> str:
        """Predict protein-ligand complex. Returns path to CIF file."""
        ...

class AntibodyEngine(ABC):
    @abstractmethod
    async def predict(self, heavy: str, light: str) -> str:
        """Predict antibody structure. Returns path to PDB file."""
        ...`}</code></pre>

      <h2 id="example">Example: adding Boltz-2</h2>

      <p>To add a new structure prediction engine:</p>

      <pre><code>{`# backend/engines/boltz2.py
from .base import StructureEngine
import httpx

class Boltz2Engine(StructureEngine):
    def __init__(self, base_url: str = "http://boltz2:5004"):
        self.base_url = base_url

    async def predict_complex(self, protein_seq: str, ligand_smiles: str) -> str:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/predict",
                json={"sequence": protein_seq, "ligand": ligand_smiles}
            )
            return resp.json()["structure_path"]`}</code></pre>

      <p>
        Then update the dependency injection in the backend configuration to use the new engine.
        No router changes needed.
      </p>

      <h2 id="current-engines">Current engines</h2>

      <table>
        <thead>
          <tr><th>Function</th><th>Current engine</th><th>Possible alternatives</th></tr>
        </thead>
        <tbody>
          <tr><td>Pocket prediction</td><td>P2Rank</td><td>FPocket, DeepSite, SiteMap</td></tr>
          <tr><td>Structure prediction</td><td>AlphaFold 3</td><td>Boltz-2, Chai-1, ESMFold</td></tr>
          <tr><td>Antibody modeling</td><td>ImmuneBuilder</td><td>ABodyBuilder3, IgFold</td></tr>
          <tr><td>Cheminformatics</td><td>RDKit</td><td>OpenBabel, CDK</td></tr>
        </tbody>
      </table>

      <p><Link href="/docs/microservices">Next: Microservices &rarr;</Link></p>
    </>
  );
}
