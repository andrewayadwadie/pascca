// .stats-list (contracts/component-api.md)
export function StatsList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="stats-list">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <b>{item.value}</b>
        </div>
      ))}
    </div>
  );
}
