// .lbl (contracts/component-api.md)
import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="lbl">{children}</span>;
}
