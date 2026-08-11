// .ok — the two success states from FR-034 (contracts/component-api.md). Local state only;
// nothing here ever fires a network request (FR-033).
export function ResultBox({ state, message }: { state: "idle" | "confirmed" | "call-required"; message: string }) {
  return (
    <div className={state === "idle" ? "ok" : "ok show"} role={state === "idle" ? undefined : "status"}>
      {message}
    </div>
  );
}
