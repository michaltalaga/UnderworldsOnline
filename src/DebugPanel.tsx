import { useState, type ReactNode } from "react";

type DebugPanelProps = {
  children: ReactNode;
};

export default function DebugPanel({ children }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="fixed left-4 bottom-[calc(28vh+16px)] z-[32] font-body flex flex-col-reverse gap-2.5 items-start">
      <button
        type="button"
        className="py-2 px-4 rounded-pill border border-[rgba(85,66,40,0.3)] bg-[rgba(253,249,242,0.96)] text-[#4a3a25] font-[inherit] text-[0.78rem] font-bold tracking-[0.04em] cursor-pointer shadow-[0_10px_22px_rgba(63,46,29,0.18)] backdrop-blur-[10px] transition-all duration-[120ms] ease-in-out hover:-translate-y-px hover:bg-parchment-dark hover:shadow-[0_14px_26px_rgba(63,46,29,0.22)]"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        {isOpen ? "Hide debug" : "Show debug"}
      </button>
      {isOpen ? (
        <div className="box-border w-[min(420px,calc(100vw-32px))] max-h-[calc(72vh-80px)] overflow-y-auto p-4 px-[18px] bg-[rgba(253,249,242,0.96)] border border-[rgba(85,66,40,0.22)] rounded-card shadow-[0_18px_44px_rgba(63,46,29,0.22)] backdrop-blur-[12px] grid gap-3.5">
          {children}
        </div>
      ) : null}
    </aside>
  );
}
