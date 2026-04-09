import Link from 'next/link';

export const metadata = { title: 'Adding New Engines' };

export default function AddingEnginesPage() {
  return (
    <>
      <h1>Adding new engines</h1>

      <p>
        OpenDDE&rsquo;s modular architecture makes it straightforward to add new computational
        engines. This guide walks through the process step by step.
      </p>

      <h2 id="overview">Overview</h2>

      <ol>
        <li>Create a Docker service for the new tool</li>
        <li>Implement the adapter interface in the backend</li>
        <li>Register the service in <code>docker-compose.yml</code></li>
        <li>Update the backend configuration to use the new engine</li>
      </ol>

      <h2 id="step1">Step 1: Create the Docker service</h2>

      <p>Create a new directory for your engine:</p>

      <pre><code>{`mkdir services/my-engine
cd services/my-engine`}</code></pre>

      <p>Write a minimal Flask/FastAPI wrapper:</p>

      <pre><code>{`# services/my-engine/app.py
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    # ... your prediction logic ...
    return jsonify({"result": result})`}</code></pre>

      <p>Create a Dockerfile:</p>

      <pre><code>{`FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5004"]`}</code></pre>

      <h2 id="step2">Step 2: Implement the adapter</h2>

      <p>
        See <Link href="/docs/engine-swap">Engine swap layer</Link> for the adapter interface
        pattern. Implement the appropriate abstract class for your engine type.
      </p>

      <h2 id="step3">Step 3: Register in Docker Compose</h2>

      <pre><code>{`# docker-compose.yml
services:
  my-engine:
    build: ./services/my-engine
    ports:
      - "5004:5004"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5004/health"]
      interval: 30s
      timeout: 10s
      retries: 3`}</code></pre>

      <h2 id="step4">Step 4: Update configuration</h2>

      <p>
        Update the backend configuration to point to your new engine. The exact mechanism depends
        on which engine type you&rsquo;re replacing or adding.
      </p>

      <p><Link href="/docs/code-structure">Next: Code structure &rarr;</Link></p>
    </>
  );
}
