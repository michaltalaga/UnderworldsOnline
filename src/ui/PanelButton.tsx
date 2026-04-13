import type { ReactNode } from "react";

type PanelButtonProps = {
  children: ReactNode;
  onClick: () => void;
  className?: string;
};

/** A clickable card surface — used for selection screens (warband, deck, territory). */
export default function PanelButton({ children, onClick, className = "" }: PanelButtonProps) {
  return (
    <button
      type="button"
      className={`w-full bg-surface border border-border rounded-panel shadow-panel backdrop-blur-[12px] p-6 grid gap-4 text-left font-[inherit] text-[inherit] cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-panel-hover focus-visible:-translate-y-0.5 focus-visible:border-border-strong focus-visible:shadow-panel-hover focus-visible:outline-none ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
