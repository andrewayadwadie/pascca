// US4 — Branches. Two BranchCards via getBranches(), map placeholder, large-groups SplitPanel,
// LocalBusiness+Restaurant JSON-LD per branch (FR-048).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getBranches, getPageBlocks, getPageSeo } from "../../../lib/content";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { MobileCtaBar } from "../../../components/MobileCtaBar";
import { PageHero } from "../../../components/PageHero";
import { Grid } from "../../../components/Grid";
import { StaggerGroup } from "../../../components/StaggerGroup";
import { BranchCard } from "../../../components/BranchCard";
import { ImageSlot } from "../../../components/ImageSlot";
import { Panel } from "../../../components/Panel";
import { SplitPanel } from "../../../components/SplitPanel";
import { StatsList } from "../../../components/StatsList";
import { Button } from "../../../components/Button";

function findBlock(blocks: ReturnType<typeof getPageBlocks>, key: string) {
  const block = blocks.find((b) => b.block === key);
  if (!block) throw new Error(`Branches page: missing seeded default for block "${key}" (FR-023)`);
  return block;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = getPageSeo("branches");
  return { title: seo?.titleEn, description: seo?.descriptionEn };
}

export default async function BranchesPage() {
  const blocks = getPageBlocks("branches");
  const hero = findBlock(blocks, "hero");
  const mapBlock = findBlock(blocks, "map");
  const largeGroups = findBlock(blocks, "large-groups");
  const branches = getBranches();
  const tNav = await getTranslations("nav");
  const tCta = await getTranslations("cta");

  const groupStats = [
    { label: "Group line", value: "0102 507 0801" },
    { label: "Notice preferred", value: "24h" },
    { label: "Largest table", value: "20" },
  ];

  const jsonLd = branches.map((branch) => ({
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: branch.nameEn,
    address: branch.addressEn,
    telephone: branch.phone,
    servesCuisine: "Italian",
    url: branch.mapUrl ?? undefined,
  }));

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <PageHero crumb={tNav("branches")} headline={hero.headlineEn} emphasis={hero.emphasisEn ?? undefined} lede={hero.subEn ?? undefined} />

        <section>
          <div className="wrap">
            <Grid cols={2}>
              <StaggerGroup>
                {branches.map((branch) => (
                  <BranchCard
                    key={branch.slug}
                    name={branch.nameEn}
                    badge={branch.slug === "heliopolis" ? "Open 24 hours" : "Since 2018"}
                    imageSlot={{ ratio: "1/1", tone: branch.slug === "shobra" ? "cream" : "warm", label: `${branch.nameEn} branch photo` }}
                    address={branch.addressEn}
                    rows={[
                      { label: "Phone", value: branch.phone },
                      { label: "Hours", value: branch.hoursLabel },
                      ...(branch.ratingLabel ? [{ label: "Google rating", value: branch.ratingLabel }] : []),
                      ...(branch.deliveryAreaLabel ? [{ label: "Delivery area", value: branch.deliveryAreaLabel }] : []),
                    ]}
                    primaryCta={{ label: tCta("callBranch"), href: `tel:${branch.phone.replace(/\s+/g, "")}` }}
                    secondaryCta={{ label: tCta("directions"), href: branch.mapUrl ?? "#" }}
                  />
                ))}
              </StaggerGroup>
            </Grid>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <ImageSlot ratio="21/8" tone="stone" label={mapBlock.headlineEn} />
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <Panel glow>
              <SplitPanel
                left={
                  <div>
                    <p className="lbl">{largeGroups.eyebrowEn}</p>
                    <h2 style={{ marginBlockStart: 18 }}>
                      {largeGroups.headlineEn.replace(largeGroups.emphasisEn ?? "", "")}
                      {largeGroups.emphasisEn ? <em>{largeGroups.emphasisEn}</em> : null}
                    </h2>
                    <p className="lede" style={{ marginBlockStart: 20, maxWidth: "48ch" }}>
                      {largeGroups.subEn}
                    </p>
                    <div style={{ marginBlockStart: 28 }}>
                      <Button variant="gold" size="md" href={largeGroups.ctaHref ?? "tel:01025070801"}>
                        {largeGroups.ctaLabelEn}
                      </Button>
                    </div>
                  </div>
                }
                right={<StatsList items={groupStats} />}
              />
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
