import type { ReactNode } from "react";

type PillButtonProps = {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  "aria-pressed"?: boolean;
};

/** Rounded pill-shaped toggle/action button — used for roll presets, token toggles, ability selectors. */
export default function PillButton({
  children,
  active = false,
  disabled = false,
  onClick,
  className = "",
  ...rest
}: PillButtonProps) {
  return (
    <button
      type="button"
      className={[
        "border border-[rgba(138,68,42,0.28)] bg-[rgba(255,251,242,0.85)] text-[#5a3a20] rounded-pill py-2.5 px-3.5 font-[inherit] font-bold cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:!translate-y-0",
        active ? "!bg-accent !text-[#fff6ed]" : "",
        className,
      ].filter(Boolean).join(" ")}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
