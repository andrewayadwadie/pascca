// .enter — hero-load stagger variant (contracts/component-api.md): runs unconditionally on
// mount via CSS keyframes (`.enter>*` in globals.css), not IO-gated like Reveal/StaggerGroup —
// matches files/site's own header .enter wrapper, used above the fold where content is already
// visible on load.
import type { ReactNode } from "react";

export function EnterGroup({ children }: { children: ReactNode }) {
  return <div className="enter">{children}</div>;
}
