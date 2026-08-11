"use client";

// .dish (contracts/component-api.md)
import { useTranslations } from "next-intl";
import { ImageSlot, type ImageSlotProps } from "./ImageSlot";
import { GoldLink } from "./GoldLink";

export interface DishCardProps {
  name: string;
  priceLabel: string;
  description: string;
  imageSlot: ImageSlotProps;
  badge?: string | undefined;
  href: string;
}

export function DishCard({ name, priceLabel, description, imageSlot, badge, href }: DishCardProps) {
  const t = useTranslations("cta");
  return (
    <article className="dish">
      <ImageSlot {...imageSlot} badge={badge} />
      <div className="body">
        <div className="top">
          <h3>{name}</h3>
          <span className="pr">{priceLabel}</span>
        </div>
        <p>{description}</p>
        <GoldLink href={href}>{t("viewDish")}</GoldLink>
      </div>
    </article>
  );
}
