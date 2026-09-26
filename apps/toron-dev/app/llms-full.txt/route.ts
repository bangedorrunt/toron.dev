import { docsLlms } from '@/lib/source';

// governed-by: ADR-0005 D2
// Every docs page rendered as Markdown in one file. The single-fetch option
// for an agent that wants the whole site without walking the tree.
export const revalidate = false;

export async function GET() {
  return new Response(await docsLlms.full(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
