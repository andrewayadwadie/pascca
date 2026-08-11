// US3 — Contact. Form submits nowhere (FR-033). Branch cards reuse the same BranchCard US4
// ships (contracts/component-api.md) — no stub needed since it's built already.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getBranches, getPageBlocks, getPageSeo } from "../../../lib/content";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { MobileCtaBar } from "../../../components/MobileCtaBar";
import { PageHero } from "../../../components/PageHero";
import { Panel } from "../../../components/Panel";
import { StatsList } from "../../../components/StatsList";
import { ContactForm } from "../../../components/ContactForm";
import { Button } from "../../../components/Button";
import { Grid } from "../../../components/Grid";
import { BranchCard } from "../../../components/BranchCard";

function findBlock(blocks: ReturnType<typeof getPageBlocks>, key: string) {
  const block = blocks.find((b) => b.block === key);
  if (!block) throw new Error(`Contact page: missing seeded default for block "${key}" (FR-023)`);
  return block;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = getPageSeo("contact");
  return { title: seo?.titleEn, description: seo?.descriptionEn };
}

export default async function ContactPage() {
  const blocks = getPageBlocks("contact");
  const hero = findBlock(blocks, "hero");
  const contactRail = findBlock(blocks, "contact-rail");
  const branchCardsBlock = findBlock(blocks, "branch-cards");
  const branches = getBranches();
  const tNav = await getTranslations("nav");
  const tCta = await getTranslations("cta");

  const railItems = [
    { label: "Reservations", value: branches[0]?.phone ?? "" },
    { label: "Heliopolis", value: branches[1]?.phone ?? "" },
    { label: "Groups & events", value: "0102 507 0801" },
    { label: "Email", value: "Pasccapizzeria@gmail.com" },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <PageHero crumb={tNav("contact")} headline={hero.headlineEn} emphasis={hero.emphasisEn ?? undefined} lede={hero.subEn ?? undefined} />

        <section>
          <div className="wrap" style={{ display: "grid", gridTemplateColumns: ".85fr 1.15fr", gap: "clamp(28px,5vw,72px)", alignItems: "start" }}>
            <div>
              <p className="lbl sr-only">{contactRail.headlineEn}</p>
              <StatsList items={railItems} />
              <div className="acts" style={{ marginBlockStart: 24 }}>
                <Button variant="gold" size="sm" href="https://wa.me/201201251110">
                  {tCta("whatsappUs")}
                </Button>
                <Button variant="outline" size="sm" href="https://www.instagram.com/pasccarestaurant/">
                  {tCta("instagramLink")}
                </Button>
              </div>
            </div>

            <Panel>
              <ContactForm />
            </Panel>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <p className="lbl sr-only">{branchCardsBlock.headlineEn}</p>
            <Grid cols={2}>
              {branches.map((branch) => (
                <BranchCard
                  key={branch.slug}
                  name={branch.nameEn}
                  badge={branch.hoursLabel}
                  imageSlot={{ ratio: "16/9", tone: branch.slug === "shobra" ? "cream" : "warm", label: `${branch.nameEn} branch photo` }}
                  address={branch.addressEn}
                  rows={[
                    { label: "Hours", value: branch.hoursLabel },
                    { label: "Phone", value: branch.phone },
                  ]}
                  primaryCta={{ label: tCta("callBranch"), href: `tel:${branch.phone.replace(/\s+/g, "")}` }}
                  secondaryCta={{ label: tCta("directions"), href: branch.mapUrl ?? "#" }}
                />
              ))}
            </Grid>
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
