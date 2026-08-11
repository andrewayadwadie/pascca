// .badge .bd-1 .bd-2 (contracts/component-api.md). Position (top-right vs bottom-left) comes
// from source order within .stage (globals.css's `.stage .badge:nth-of-type()`), not a prop —
// `rotate` is the one per-instance transform the frozen prop list does carry.
export interface FloatingBadgeProps {
  icon: string;
  title: string;
  subtitle: string;
  rotate?: number;
}

export function FloatingBadge({ icon, title, subtitle, rotate }: FloatingBadgeProps) {
  return (
    <div className="badge" style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}>
      <i>{icon}</i>
      <div>
        <b>{title}</b>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}
