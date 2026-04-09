import Link from 'next/link';

export const metadata = { title: 'Pocket Discovery' };

export default function PocketDiscoveryPage() {
  return (
    <>
      <h1>Pocket discovery</h1>

      <p>
        Pocket discovery is the process of identifying regions on a protein&rsquo;s surface where
        small molecules (drugs) are most likely to bind. OpenDDE uses{' '}
        <strong>P2Rank</strong>, a machine-learning tool developed at the Czech Technical
        University, to predict these binding pockets.
      </p>

      <h2 id="what-is-a-binding-pocket">What is a binding pocket?</h2>

      <p>
        Proteins are large, complex 3D molecules. Their surfaces have grooves, clefts, and cavities.
        A <strong>binding pocket</strong> is a specific cavity where a drug molecule can physically
        fit and form chemical interactions (hydrogen bonds, hydrophobic contacts, salt bridges).
      </p>

      <p>
        Think of it like a lock: the pocket is the keyhole, and the drug is the key. For a drug
        to work, it must fit snugly into the right pocket on the right protein.
      </p>

      <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="mb-2 text-2xl">🔬</div>
            <div className="font-medium text-foreground">Protein surface</div>
            <div className="text-muted-2">Complex 3D topology</div>
          </div>
          <div>
            <div className="mb-2 text-2xl">🕳️</div>
            <div className="font-medium text-foreground">Binding pocket</div>
            <div className="text-muted-2">Cavity with chemical features</div>
          </div>
          <div>
            <div className="mb-2 text-2xl">💊</div>
            <div className="font-medium text-foreground">Drug molecule</div>
            <div className="text-muted-2">Fits into the pocket</div>
          </div>
        </div>
      </div>

      <h2 id="how-p2rank-works">How P2Rank works</h2>

      <p>
        P2Rank is a machine-learning method that predicts ligand-binding sites from a protein
        structure. Here&rsquo;s how it works:
      </p>

      <ol>
        <li>
          <strong>Surface point sampling</strong> &mdash; The protein surface is sampled as a set
          of points using a Connolly surface algorithm
        </li>
        <li>
          <strong>Feature extraction</strong> &mdash; For each point, P2Rank computes chemical and
          geometric features: hydrophobicity, charge, surface curvature, atom density, etc.
        </li>
        <li>
          <strong>ML scoring</strong> &mdash; A random forest classifier scores each point for its
          likelihood of being part of a binding site
        </li>
        <li>
          <strong>Clustering</strong> &mdash; High-scoring points are clustered into discrete
          pockets, ranked by aggregate score
        </li>
      </ol>

      <h2 id="understanding-scores">Understanding druggability scores</h2>

      <p>
        Each predicted pocket receives a <strong>druggability score</strong> between 0 and 1:
      </p>

      <table>
        <thead>
          <tr>
            <th>Score range</th>
            <th>Interpretation</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>0.80 &ndash; 1.00</code></td>
            <td>Highly druggable</td>
            <td>Deep, well-defined cavity. Strong candidate for small-molecule binding.</td>
          </tr>
          <tr>
            <td><code>0.50 &ndash; 0.79</code></td>
            <td>Moderately druggable</td>
            <td>Reasonable pocket but may be shallow or partially exposed.</td>
          </tr>
          <tr>
            <td><code>0.20 &ndash; 0.49</code></td>
            <td>Challenging</td>
            <td>Flat or exposed surface. May require fragment-based approaches.</td>
          </tr>
          <tr>
            <td><code>0.00 &ndash; 0.19</code></td>
            <td>Unlikely</td>
            <td>Not a viable drug binding site with current methods.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="pocket-residues">How to interpret pocket residues</h2>

      <p>
        Each pocket is defined by the amino acid residues that form its walls. OpenDDE shows
        you the residue composition:
      </p>

      <ul>
        <li>
          <strong>Hydrophobic residues</strong> (Leu, Ile, Val, Phe) &mdash; form the &ldquo;greasy&rdquo;
          interior of the pocket. More hydrophobic = better for small-molecule binding.
        </li>
        <li>
          <strong>Polar residues</strong> (Ser, Thr, Asn, Gln) &mdash; provide hydrogen bonding
          partners for drug design.
        </li>
        <li>
          <strong>Charged residues</strong> (Asp, Glu, Lys, Arg) &mdash; can form salt bridges
          with charged drug groups.
        </li>
        <li>
          <strong>Aromatic residues</strong> (Phe, Tyr, Trp) &mdash; enable pi-stacking
          interactions with aromatic drug rings.
        </li>
      </ul>

      <h2 id="limitations">Limitations and caveats</h2>

      <ul>
        <li>
          <strong>Static structures</strong> &mdash; P2Rank operates on a single 3D snapshot.
          Proteins are dynamic; some pockets only open during conformational changes (cryptic
          sites).
        </li>
        <li>
          <strong>Allosteric sites</strong> &mdash; P2Rank focuses on orthosteric (active site)
          pockets. Allosteric sites may be ranked lower even if therapeutically relevant.
        </li>
        <li>
          <strong>Predicted structures</strong> &mdash; When using AlphaFold-predicted structures
          (vs. experimental crystal structures), pocket predictions may be less reliable in
          low-confidence regions.
        </li>
        <li>
          <strong>Protein-protein interfaces</strong> &mdash; Pockets at protein-protein
          interaction sites may not be detected as traditional small-molecule binding sites.
        </li>
      </ul>

      <p>
        <Link href="/docs/ligand-intelligence">Next: Ligand intelligence &rarr;</Link>
      </p>
    </>
  );
}
