// .val (contracts/component-api.md)
export function ValueCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="val">
      <i>{icon}</i>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}
