import { render } from "pele";
import { fromHtml } from "hast-util-from-html";

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

const FONT_SANS = "Inter, ui-sans-serif, system-ui, sans-serif";
const FONT_MONO = "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace";

function textContent(node: HastNode): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(textContent).join("");
}

function isMermaidPre(node: HastNode): boolean {
  if (node.type !== "element" || node.tagName !== "pre") return false;
  const code = node.children?.find((child) => child.type === "element" && child.tagName === "code");
  const className = code?.properties?.className;
  return Array.isArray(className) && className.some((name) => name === "language-mermaid");
}

function walk(node: HastNode, transform: (parent: HastNode, index: number) => void): void {
  node.children?.forEach((child, index) => {
    transform(node, index);
    walk(child, transform);
  });
}

export function rehypePele() {
  return (tree: HastNode) => {
    let diagram = 0;
    walk(tree, (parent, index) => {
      const node = parent.children?.[index];
      if (!node || !isMermaidPre(node)) return;

      const source = textContent(node).trim();
      if (!source) throw new Error("empty mermaid block");

      const diagramId = diagram++;
      const options = {
        responsive: true,
        fontSize: 13,
        fontFamily: FONT_SANS,
        fontFamilyMono: FONT_MONO,
      };
      const svgFrom = (markup: string): HastNode => {
        const parsed = fromHtml(markup, { fragment: true }) as unknown as HastNode;
        const svg = parsed.children?.find(
          (child) => child.type === "element" && child.tagName === "svg",
        );
        if (!svg) throw new Error("Pele returned markup without an svg root");
        return svg;
      };
      const variant = (label: string, maxWidth: number, autoDirection: boolean): HastNode => ({
        type: "element",
        tagName: "div",
        properties: { className: [`toron-mermaid__${label}`] },
        children: [
          svgFrom(
            render(source, {
              ...options,
              idPrefix: `toron-diagram-${diagramId}-${label}`,
              maxWidth,
              autoDirection,
            }).svg,
          ),
        ],
      });
      const directional = /^(?:flowchart|graph)\s+(?:LR|RL)\b/m.test(source);
      const wide = variant("wide", 1120, false);
      const narrow = directional ? variant("narrow", 360, true) : null;

      parent.children![index] = {
        type: "element",
        tagName: "div",
        properties: {
          className: ["toron-mermaid", ...(narrow ? ["toron-mermaid--responsive"] : [])],
        },
        children: narrow ? [wide, narrow] : [wide],
      };
    });
  };
}
