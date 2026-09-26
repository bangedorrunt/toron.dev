import { llms, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { docsContentRoute, docsRoute } from "./shared";
import { defineDocs } from "fumadocs-mdx/macro";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { markdownComponents } from "./markdown";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    postprocess: {
      // governed-by: ADR-0005 D2
      //
      // `output: "function"` keeps JSX as JSX through stringification instead of
      // writing it back as source text. The string form is what leaked raw
      // `<Step>` and `<Fail>` tags into every agent-facing representation; the
      // function form hands the components to `markdownComponents`, which gives
      // each one a Markdown form. The build-time mermaid pass is unaffected
      // either way: a mermaid fence is a code block, not a component.
      includeProcessedMarkdown: { output: "function" },
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageMarkdownUrl(page: (typeof source)["$inferPage"]) {
  const segments = [...page.slugs, "content.md"];

  return {
    segments,
    url: "/" + [page.locale, ...docsContentRoute.split("/"), ...segments].filter(Boolean).join("/"),
  };
}

export async function getLLMText(page: (typeof source)["$inferPage"]) {
  const processed = await page.data.getText("processed", { components: markdownComponents });

  return `# ${page.data.title} (${page.url})

${processed}`;
}

// governed-by: ADR-0005 D2
// One renderer behind every machine-readable representation of the docs:
// /llms.txt, /llms-full.txt, /docs/<slug>.md, and the MCP page tools. Reading
// the *processed* document is what makes mermaid and MDX components already
// resolved for the agent instead of shipping as source.
export const docsLlms = llms(source, { renderPage: getLLMText });
