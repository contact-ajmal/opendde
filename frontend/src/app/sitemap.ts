import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://opendde.dev';

  const staticPages = [
    '',
    '/learn',
    '/learn/drug-discovery-101',
    '/learn/how-opendde-works',
    '/learn/understanding-proteins',
    '/learn/target-to-drug',
    '/docs',
    '/docs/quick-start',
    '/docs/system-requirements',
    '/docs/docker-setup',
    '/docs/pocket-discovery',
    '/docs/ligand-intelligence',
    '/docs/complex-prediction',
    '/docs/antibody-modeling',
    '/docs/ai-assistant',
    '/docs/druglikeness-scoring',
    '/docs/druggability-reports',
    '/docs/sar-analysis',
    '/docs/architecture',
    '/docs/system-overview',
    '/docs/engine-swap',
    '/docs/microservices',
    '/docs/database-schema',
    '/docs/api-reference',
    '/docs/development-setup',
    '/docs/adding-engines',
    '/docs/code-structure',
    '/docs/pull-request-guide',
  ];

  return staticPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('/learn') ? 0.8 : 0.6,
  }));
}
