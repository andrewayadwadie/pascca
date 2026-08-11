// .split (contracts/component-api.md) — grid-template-columns: 1.15fr .85fr, the first grid
// child always in the wider column. `reverse` swaps which side occupies it.
import type { ReactNode } from "react";

export function SplitPanel({
  left,
  right,
  reverse,
}: {
  left: ReactNode;
  right: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="split">
      {reverse ? right : left}
      {reverse ? left : right}
    </div>
  );
}
