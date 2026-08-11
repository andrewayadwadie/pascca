// .chip .chip-g (contracts/component-api.md)
import type { ReactNode } from "react";

export function Chip({ variant, children }: { variant: "fasting" | "veg"; children: ReactNode }) {
  return <span className={variant === "fasting" ? "chip chip-g" : "chip"}>{children}</span>;
}
