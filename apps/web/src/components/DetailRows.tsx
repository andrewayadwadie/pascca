// .rows .row (contracts/component-api.md)
export function DetailRows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="rows">
      {rows.map((row) => (
        <div className="row" key={row.label}>
          <span>{row.label}</span>
          <b>{row.value}</b>
        </div>
      ))}
    </div>
  );
}
