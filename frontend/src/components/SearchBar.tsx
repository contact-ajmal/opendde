'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiPost('/target/resolve', { query: trimmed });
      router.push(`/target/${result.uniprot_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resolve target');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[600px]">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter UniProt ID, PDB ID, or gene name..."
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Search'
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </form>
  );
}
