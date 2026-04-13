import type { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
};

/** Uppercase label — used for section titles, card categories, and badges. */
export default function Eyebrow({ children, className = "" }: EyebrowProps) {
  return (
    <p className={`m-0 mb-2 uppercase tracking-[0.14em] text-[0.72rem] text-accent ${className}`}>
      {children}
    </p>
  );
}
