import type { ReactNode } from "react";

type SetupHeroProps = {
  title: string;
  description: string | ReactNode;
  badge?: string;
};

/** Centered hero header used during setup phases — territory, deployment, mulligan, etc. */
export default function SetupHero({ title, description, badge }: SetupHeroProps) {
  return (
    <header className="text-center grid gap-2">
      {badge !== undefined && (
        <span className="inline-flex mx-auto px-3.5 py-1.5 rounded-pill text-[0.78rem] tracking-[0.08em] uppercase bg-[rgba(85,66,40,0.12)] text-[#4a3a25]">
          {badge}
        </span>
      )}
      <h1 className="m-0 font-heading text-[clamp(2rem,3.6vw,3rem)] tracking-[0.01em]">
        {title}
      </h1>
      <p className="m-0 text-ink-soft text-[1.05rem]">{description}</p>
    </header>
  );
}
