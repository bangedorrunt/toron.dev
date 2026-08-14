import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

// Static search: the exported search index is pre-rendered at build time
// (ADR-0002 D6: zero external service, client-side ZBSearch/Orama static).
// The client fetches the index from this route once, then searches locally.
export const revalidate = false;
export const { staticGET: GET } = createFromSource(source);
