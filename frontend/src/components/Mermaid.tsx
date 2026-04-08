"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface MermaidProps {
  chart: string;
  caption?: string;
}

export default function Mermaid({ chart, caption }: MermaidProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rawId = useId();
  // Mermaid rejects IDs containing ":" (React's useId uses them).
  const id = `mermaid-${rawId.replace(/:/g, "")}`;
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = resolvedTheme !== "light";

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "strict",
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
          themeVariables: isDark
            ? {
                background: "transparent",
                primaryColor: "#1e293b",
                primaryTextColor: "#e2e8f0",
                primaryBorderColor: "#6366f1",
                lineColor: "#64748b",
                secondaryColor: "#0f172a",
                tertiaryColor: "#0b1220",
                mainBkg: "#0f172a",
                nodeBorder: "#6366f1",
                clusterBkg: "#0b1220",
                clusterBorder: "#334155",
                titleColor: "#e2e8f0",
                edgeLabelBackground: "#0b1220",
                textColor: "#cbd5e1",
              }
            : {
                background: "transparent",
                primaryColor: "#eef2ff",
                primaryTextColor: "#1e293b",
                primaryBorderColor: "#6366f1",
                lineColor: "#475569",
                secondaryColor: "#f1f5f9",
                tertiaryColor: "#ffffff",
                mainBkg: "#ffffff",
                nodeBorder: "#6366f1",
                clusterBkg: "#f8fafc",
                clusterBorder: "#cbd5e1",
                titleColor: "#0f172a",
                edgeLabelBackground: "#ffffff",
                textColor: "#1e293b",
              },
        });

        const { svg: rendered } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, id, resolvedTheme]);

  if (error) {
    return (
      <div className="rounded-xl border border-error/20 bg-error-glow p-4 text-xs font-mono text-error-fg">
        Mermaid error: {error}
      </div>
    );
  }

  return (
    <figure className="my-2">
      <div
        ref={containerRef}
        className="rounded-xl border border-surface-border bg-dark-50 p-4 lg:p-6 overflow-x-auto flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && (
        <figcaption className="mt-2 text-center text-[11px] font-mono uppercase tracking-widest text-text-disabled">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
