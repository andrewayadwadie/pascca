// US2 — Menu filters are shareable and server-renderable (research R12). `searchParams.filter`
// is read server-side and the initial HTML already contains only the matching rows — no flash
// of the full list, no client-only hydration step (Edge Cases, FR-031).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getMenu, getPageBlocks, getPageSeo } from "../../../lib/content";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { MobileCtaBar } from "../../../components/MobileCtaBar";
import { PageHero } from "../../../components/PageHero";
import { MenuRow } from "../../../components/MenuRow";
import { MenuFilterBar } from "../../../components/MenuFilterBar";
import { Panel } from "../../../components/Panel";
import { Button } from "../../../components/Button";

const KNOWN_FILTERS = new Set([
  "all",
  "pizza",
  "calzone",
  "pasta",
  "mains",
  "starters",
  "breakfast",
  "desserts",
  "drinks",
  "fasting",
  "veg",
]);

function findBlock(blocks: ReturnType<typeof getPageBlocks>, key: string) {
  const block = blocks.find((b) => b.block === key);
  if (!block) throw new Error(`Menu page: missing seeded default for block "${key}" (FR-023)`);
  return block;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = getPageSeo("menu");
  return { title: seo?.titleEn, description: seo?.descriptionEn };
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter = rawFilter && KNOWN_FILTERS.has(rawFilter) ? rawFilter : "all";

  const blocks = getPageBlocks("menu");
  const hero = findBlock(blocks, "hero");
  const ctaBlock = findBlock(blocks, "cta");
  const tNav = await getTranslations("nav");
  const tChips = await getTranslations("chips");
  const tFilters = await getTranslations("filters");

  const menu = getMenu()
    .map(({ category, items }) => ({
      category,
      items: items.filter((item) => {
        if (filter === "all") return true;
        if (filter === "fasting") return item.isFasting;
        if (filter === "veg") return item.isVegetarian;
        return item.categorySlug === filter;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const resultCount = menu.reduce((sum, group) => sum + group.items.length, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Menu",
    hasMenuSection: menu.map((group) => ({
      "@type": "MenuSection",
      name: group.category.nameEn,
      hasMenuItem: group.items.map((item) => ({
        "@type": "MenuItem",
        name: item.nameEn,
        description: item.descriptionEn ?? undefined,
        offers: { "@type": "Offer", price: (item.price / 100).toFixed(2), priceCurrency: "EGP" },
      })),
    })),
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <PageHero
          crumb={tNav("menu")}
          headline={hero.headlineEn}
          emphasis={hero.emphasisEn ?? undefined}
          lede={hero.subEn ?? undefined}
        />

        <section>
          <div className="wrap">
            <MenuFilterBar value={filter} resultCount={resultCount} />

            {resultCount === 0 ? (
              <p className="lede">{tFilters("noResults")}</p>
            ) : (
              menu.map((group) => (
                <div key={group.category.slug} data-group style={{ marginBlockEnd: 56 }}>
                  <h3 style={{ marginBlockEnd: 6 }}>{group.category.nameEn}</h3>
                  {group.items.map((item) => {
                    const chips: { label: string; variant: "fasting" | "veg" }[] = [];
                    if (item.isFasting) chips.push({ label: tChips("fasting"), variant: "fasting" });
                    if (item.isVegetarian) chips.push({ label: tChips("veg"), variant: "veg" });
                    return (
                      <div key={item.slug} data-cat={item.categorySlug}>
                        <MenuRow
                          name={item.nameEn}
                          description={item.descriptionEn ?? ""}
                          priceLabel={String(item.price / 100)}
                          chips={chips}
                          imageSlot={item.imageSlot}
                        />
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <Panel glow>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ margin: "0 auto", maxWidth: "16ch" }}>
                  {ctaBlock.headlineEn.replace(ctaBlock.emphasisEn ?? "", "")}
                  {ctaBlock.emphasisEn ? <em>{ctaBlock.emphasisEn}</em> : null}
                </h2>
                <div className="acts" style={{ justifyContent: "center", marginBlockStart: 30 }}>
                  <Button variant="gold" size="md" href={ctaBlock.ctaHref ?? "/reservations"}>
                    {ctaBlock.ctaLabelEn}
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileCtaBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
