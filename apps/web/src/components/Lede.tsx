// .lede — width maps only to --w/--w70/--w60 (FR-041, contracts/component-api.md). Body copy
// never uses --gold (Article 28).
import type { ReactNode } from "react";

export interface LedeProps {
  children: ReactNode;
  width?: "full" | "70" | "60";
}

export function Lede({ children, width = "full" }: LedeProps) {
  const style = width === "70" ? { color: "var(--w70)" } : width === "60" ? { color: "var(--w60)" } : undefined;
  return (
    <p className="lede" style={style}>
      {children}
    </p>
  );
}
