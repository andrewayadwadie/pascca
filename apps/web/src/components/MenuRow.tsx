// .mrow (contracts/component-api.md)
import { ImageSlot, type ImageSlotProps } from "./ImageSlot";
import { Chip } from "./Chip";

export interface MenuRowProps {
  name: string;
  description: string;
  priceLabel: string;
  chips: { label: string; variant: "fasting" | "veg" }[];
  imageSlot: ImageSlotProps;
}

export function MenuRow({ name, description, priceLabel, chips, imageSlot }: MenuRowProps) {
  return (
    <div className="mrow">
      <ImageSlot {...imageSlot} />
      <div>
        <h4>
          {name}
          {chips.map((chip) => (
            <Chip key={chip.variant} variant={chip.variant}>
              {chip.label}
            </Chip>
          ))}
        </h4>
        <p>{description}</p>
      </div>
      <span className="pr">{priceLabel}</span>
    </div>
  );
}
