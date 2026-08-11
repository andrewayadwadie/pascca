// .br (contracts/component-api.md)
import { ImageSlot, type ImageSlotProps } from "./ImageSlot";
import { DetailRows } from "./DetailRows";
import { Button } from "./Button";

export interface BranchCardProps {
  name: string;
  badge: string;
  imageSlot: ImageSlotProps;
  address: string;
  rows: { label: string; value: string }[];
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export function BranchCard({ name, badge, imageSlot, address, rows, primaryCta, secondaryCta }: BranchCardProps) {
  return (
    <article className="br">
      <ImageSlot {...imageSlot} badge={badge} />
      <div className="body">
        <h3>{name}</h3>
        <p className="ad">{address}</p>
        <DetailRows rows={rows} />
        <div className="acts">
          <Button variant="gold" size="sm" href={primaryCta.href}>
            {primaryCta.label}
          </Button>
          <Button variant="outline" size="sm" href={secondaryCta.href}>
            {secondaryCta.label}
          </Button>
        </div>
      </div>
    </article>
  );
}
