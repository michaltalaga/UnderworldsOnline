import type { ReactNode } from "react";

type CardSurfaceProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
};

/** Lighter inner card surface — used for stat cells, fighter cards, ability cards. */
export default function CardSurface({ children, className = "", as: Tag = "div" }: CardSurfaceProps) {
  return (
    <Tag className={`bg-surface-controls border border-[rgba(149,112,71,0.2)] rounded-card ${className}`}>
      {children}
    </Tag>
  );
}
