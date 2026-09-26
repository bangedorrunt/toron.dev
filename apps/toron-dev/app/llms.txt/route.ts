import { docsLlms } from "@/lib/source";

// governed-by: ADR-0005 D2
// The docs as an index: every page, its title, and its description. This is
// what an agent fetches first to decide which pages to read.
export const revalidate = false;

export async function GET() {
  return new Response(await docsLlms.index(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
