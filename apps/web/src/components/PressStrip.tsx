// .press (contracts/component-api.md)
export function PressStrip({ items }: { items: string[] }) {
  return (
    <div className="press">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}
