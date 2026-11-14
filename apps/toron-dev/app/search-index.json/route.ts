import { source } from "@/lib/source";

export const dynamic = "force-static";

export function GET() {
  const pages = source.getPages().map((page) => ({
    id: page.url,
    label: page.data.title,
    group: "Documentation",
    href: page.url,
    description: page.data.description ?? "",
    keywords: page.slugs.join(" "),
  }));

  return Response.json(pages, {
    headers: { "cache-control": "public, max-age=0, s-maxage=86400" },
  });
}
