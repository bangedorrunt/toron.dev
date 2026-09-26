import { docsLlms, source } from '@/lib/source';
import { notFound } from 'next/navigation';

// governed-by: ADR-0005 D2
// One docs page as Markdown. The public URL is the pretty one, /docs/<slug>.md,
// which next.config.mjs rewrites here. getPageMarkdownUrl builds the other
// spelling of the same route, so the Copy page button and this handler cannot
// drift apart: both name one contract.
export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>,
) {
  const { slug } = await params;
  // The rewrite appends "content.md"; drop it to get back the page slugs.
  // An `index` segment is the directory's own page, which the source addresses
  // by its parent path.
  const slugs = slug?.slice(0, -1) ?? [];
  if (slugs.at(-1) === 'index') slugs.pop();

  const page = source.getPage(slugs);
  if (!page) notFound();

  return new Response(await docsLlms.page(page), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

export function generateStaticParams() {
  return source.generateParams().map((item) => ({
    ...item,
    slug: [...item.slug, 'content.md'],
  }));
}
