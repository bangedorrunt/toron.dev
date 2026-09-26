import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { registerSearchTool, registerSourceTools } from "fumadocs-core/mcp";
import { createFromSource } from "fumadocs-core/search/server";
import { docsLlms, source } from "@/lib/source";

// governed-by: ADR-0005 D4
// The docs over MCP, for an agent that would rather query than crawl. The page
// tools read through docsLlms, so get_page returns byte-identical Markdown to
// GET /docs/<slug>.md. There is no MCP-only formatting to keep in sync.
//
// This endpoint is public and unauthenticated, like the rest of the site. It
// exposes only pages that llms-full.txt already serves in full, so it adds no
// disclosure surface — but it is still an unauthenticated route, which is why
// it lives on the same deployment instead of becoming new infrastructure.

/**
 * Search results carry `<mark>` around the matched terms, which is what the
 * browser dialog wants and what an agent cannot use: the tool returns JSON, so
 * the highlight arrives as literal HTML inside a text field. A search for
 * "reservation" shipped 83 tags into the response.
 *
 * The tags are stripped on the way out rather than in the index, because the
 * browser path needs them and the index is shared. This is not a second
 * renderer: the results, the ranking, and the excerpts are the ones
 * `createFromSource` produced, and only the markup is dropped.
 */
function unmark(text: string): string {
  return text.replace(/<\/?mark\s*\/?>/gi, "");
}

// The server is generic over its content type, and this call site is the one
// place it is instantiated with strings, so `content` is a string here. The
// helper is still typed as taking a string rather than `unknown` on purpose: it
// is called only on fields the JSON payload has already proven are text.
const stripMarks = (text: string) => unmark(text);

const search = createFromSource(source);
const searchForAgents = {
  ...search,
  search: async (query: string, options?: Parameters<typeof search.search>[1]) => {
    const results = await search.search(query, options);
    return results.map((result) => ({
      ...result,
      content: stripMarks(result.content),
      ...(result.breadcrumbs
        ? { breadcrumbs: result.breadcrumbs.map((crumb) => stripMarks(crumb)) }
        : {}),
    }));
  },
};

const server = createMcpHandler(() => {
  const mcp = new McpServer({ name: "toron.dev docs", version: "1.0.0" });

  registerSourceTools(mcp, source, docsLlms);
  registerSearchTool(mcp, searchForAgents);

  return mcp;
});

export async function GET(request: Request) {
  return server.fetch(request);
}

export async function POST(request: Request) {
  return server.fetch(request);
}

export async function DELETE(request: Request) {
  return server.fetch(request);
}
