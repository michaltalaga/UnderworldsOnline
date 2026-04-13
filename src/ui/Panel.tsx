import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
};

/** Glassmorphism card surface — the shared visual primitive for all content panels. */
export default function Panel({ children, className = "", as: Tag = "section" }: PanelProps) {
  return (
    <Tag className={`bg-surface border border-border rounded-panel shadow-panel backdrop-blur-[12px] p-6 ${className}`}>
      {children}
    </Tag>
  );
}
