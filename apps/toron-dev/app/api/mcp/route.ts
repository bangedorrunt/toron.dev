import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { registerSearchTool, registerSourceTools } from 'fumadocs-core/mcp';
import { createFromSource } from 'fumadocs-core/search/server';
import { docsLlms, source } from '@/lib/source';

// governed-by: ADR-0005 D4
// The docs over MCP, for an agent that would rather query than crawl. The page
// tools read through docsLlms, so get_page returns byte-identical Markdown to
// GET /docs/<slug>.md. There is no MCP-only formatting to keep in sync.
//
// This endpoint is public and unauthenticated, like the rest of the site. It
// exposes only pages that llms-full.txt already serves in full, so it adds no
// disclosure surface — but it is still an unauthenticated route, which is why
// it lives on the same deployment instead of becoming new infrastructure.
const server = createMcpHandler(() => {
  const mcp = new McpServer({ name: 'toron.dev docs', version: '1.0.0' });

  registerSourceTools(mcp, source, docsLlms);
  registerSearchTool(mcp, createFromSource(source));

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
