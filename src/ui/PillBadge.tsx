import type { ReactNode } from "react";

type PillBadgeTone = "success" | "failure" | "idle" | "neutral";

const toneClasses: Record<PillBadgeTone, string> = {
  success: "bg-success-bg text-success",
  failure: "bg-failure-bg text-failure",
  idle: "bg-idle-bg text-idle",
  neutral: "bg-[rgba(112,91,66,0.12)] text-[#5a4a38]",
};

type PillBadgeProps = {
  tone: PillBadgeTone;
  children: ReactNode;
  className?: string;
};

/** Small pill-shaped status badge with semantic coloring. */
export default function PillBadge({ tone, children, className = "" }: PillBadgeProps) {
  return (
    <span className={`w-fit py-1.5 px-2.5 rounded-pill text-[0.82rem] font-bold lowercase ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}
