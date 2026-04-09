import Link from 'next/link';

export const metadata = { title: 'Development Setup' };

export default function DevelopmentSetupPage() {
  return (
    <>
      <h1>Development setup</h1>

      <p>
        This guide covers setting up OpenDDE for local development with hot reloading.
      </p>

      <h2 id="prerequisites">Prerequisites</h2>

      <ul>
        <li>Docker Desktop 4.0+</li>
        <li>Node.js 18+ (for frontend development)</li>
        <li>Python 3.11+ (for backend development)</li>
        <li>Git</li>
      </ul>

      <h2 id="clone">Clone and install</h2>

      <pre><code>{`git clone https://github.com/your-org/opendde.git
cd opendde

# Frontend dependencies
cd frontend && npm install && cd ..

# Backend dependencies (optional, for IDE support)
cd backend && pip install -r requirements.txt && cd ..`}</code></pre>

      <h2 id="dev-mode">Running in development mode</h2>

      <pre><code>{`# Start all services with hot reload
docker compose up --build`}</code></pre>

      <p>
        The development <code>docker-compose.yml</code> mounts source directories as volumes,
        so changes to frontend and backend code are reflected immediately:
      </p>

      <ul>
        <li><strong>Frontend</strong>: Next.js Fast Refresh (instant updates)</li>
        <li><strong>Backend</strong>: Uvicorn with <code>--reload</code> flag</li>
      </ul>

      <h2 id="standalone-frontend">Standalone frontend development</h2>

      <p>
        If you&rsquo;re only working on the frontend and the backend is already running:
      </p>

      <pre><code>{`cd frontend
npm run dev`}</code></pre>

      <p>
        This starts Next.js on port 3000 outside Docker, connecting to the backend at
        port 8000.
      </p>

      <h2 id="testing">Running tests</h2>

      <pre><code>{`# Backend tests
cd backend && pytest

# Frontend (if tests exist)
cd frontend && npm test`}</code></pre>

      <p><Link href="/docs/adding-engines">Next: Adding new engines &rarr;</Link></p>
    </>
  );
}
