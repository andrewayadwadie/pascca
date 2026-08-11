// US1 — Home. Assembles every Article-18 home section via real components reading real
// content through lib/content (SC-008). Structural presentational data with no dedicated
// entity/accessor in the frozen contracts (contracts/content-accessors.md) — hero stats,
// floating badges, press-strip names, story/delivery stats-lists, occasion value cards — stays
// local to this file (data-model.md doesn't model these; they're not Article-3 dashboard
// content like a price or phone number, they're fixed page structure).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  getBranches,
  getFaq,
  getFeaturedDishes,
  getPageBlocks,
  getPageSeo,
  getTestimonials,
} from "../../lib/content";
import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";
import { MobileCtaBar } from "../../components/MobileCtaBar";
import { HomeHero } from "../../components/HomeHero";
import { FloatingPlate } from "../../components/FloatingPlate";
import { FloatingBadge } from "../../components/FloatingBadge";
import { PressStrip } from "../../components/PressStrip";
import { SectionHead } from "../../components/SectionHead";
import { Grid } from "../../components/Grid";
import { StaggerGroup } from "../../components/StaggerGroup";
import { DishCard } from "../../components/DishCard";
import { Panel } from "../../components/Panel";
import { SplitPanel } from "../../components/SplitPanel";
import { StatsList } from "../../components/StatsList";
import { Button } from "../../components/Button";
import { ValueCard } from "../../components/ValueCard";
import { TestimonialCard } from "../../components/TestimonialCard";
import { Accordion } from "../../components/Accordion";
import { AccordionItem } from "../../components/AccordionItem";
import { ImageSlot } from "../../components/ImageSlot";

function findBlock(blocks: ReturnType<typeof getPageBlocks>, key: string) {
  const block = blocks.find((b) => b.block === key);
  if (!block) throw new Error(`Home page: missing seeded default for block "${key}" (FR-023)`);
  return block;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = getPageSeo("home");
  return { title: seo?.titleEn, description: seo?.descriptionEn };
}

export default async function HomePage() {
  const blocks = getPageBlocks("home");
  const dishes = getFeaturedDishes();
  const branches = getBranches();
  const testimonials = getTestimonials();
  const faq = getFaq("home");
  const t = await getTranslations("cta");

  const hero = findBlock(blocks, "hero");
  const signatureDishes = findBlock(blocks, "signature-dishes");
  const story = findBlock(blocks, "story");
  const breakfast = findBlock(blocks, "breakfast");
  const occasions = findBlock(blocks, "occasions");
  const testimonialsBlock = findBlock(blocks, "testimonials");
  const delivery = findBlock(blocks, "delivery");
  const faqBlock = findBlock(blocks, "faq");
  const reservationCta = findBlock(blocks, "reservation-cta");

  // Structural presentational data — see file header comment.
  const heroStats = [
    { value: "19K", label: "Instagram family" },
    { value: "4.5★", label: "4,829 delivery reviews" },
    { value: "2", label: "Cairo branches" },
  ];
  const floatingBadges = [
    { icon: "★", title: "4.7 on Restaurant Guru", subtitle: "135 reviews" },
    { icon: "◈", title: "Best calzone in Cairo", subtitle: "Guest review", rotate: -6 },
  ];
  const pressItems = ["Bellies En Route Food Tour", "Tripadvisor", "elmenus", "Restaurant Guru", "talabat"];
  const storyStats = [
    { label: "Serving since", value: "2018" },
    { label: "Branches", value: "02" },
    { label: "Facebook community", value: "59K" },
    { label: "Nozha branch", value: "24h" },
  ];
  const occasionValues = [
    { icon: "♦", title: "Birthdays", description: "Cake service, a reserved corner and staff who know when to bring the candles out." },
    { icon: "❖", title: "Engagements & dates", description: "Quiet seating away from the pass. Ask for the outdoor terrace in Heliopolis." },
    { icon: "◈", title: "Groups over 8", description: "Call 0102 507 0801 and we'll agree a set menu and a table plan in advance." },
  ];
  const deliveryStats = [
    { label: "talabat rating", value: "4.5★" },
    { label: "Delivery reviews", value: "4,829" },
    { label: "Areas covered", value: "02" },
  ];

  const jsonLd = [
    ...branches.map((branch) => ({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: branch.nameEn,
      address: branch.addressEn,
      telephone: branch.phone,
      servesCuisine: "Italian",
      url: branch.mapUrl ?? undefined,
    })),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.questionEn,
        acceptedAnswer: { "@type": "Answer", text: item.answerEn },
      })),
    },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <header className="hero">
          <HomeHero
            eyebrow={hero.eyebrowEn ?? ""}
            headline={hero.headlineEn}
            emphasis={hero.emphasisEn ?? undefined}
            lede={hero.subEn ?? ""}
            primaryCta={{ label: hero.ctaLabelEn ?? "", href: hero.ctaHref ?? "/reservations" }}
            secondaryCta={{ label: t("seeMenu"), href: "/menu" }}
            stats={heroStats}
          />
          <div className="stage">
            <div className="halo"></div>
            <FloatingPlate imageSlot={{ ratio: "1", tone: "gold", label: "Signature plate photo" }} />
            {floatingBadges.map((badge) => (
              <FloatingBadge key={badge.title} {...badge} />
            ))}
          </div>
        </header>

        <PressStrip items={pressItems} />

        <section>
          <div className="wrap">
            <SectionHead
              eyebrow={signatureDishes.eyebrowEn ?? ""}
              headline={signatureDishes.headlineEn}
              emphasis={signatureDishes.emphasisEn ?? undefined}
              lede={signatureDishes.subEn ?? undefined}
            />
            <Grid cols={4}>
              <StaggerGroup>
                {dishes.map((dish) => (
                  <DishCard
                    key={dish.slug}
                    name={dish.nameEn}
                    priceLabel={String(dish.price / 100)}
                    description={dish.descriptionEn ?? ""}
                    imageSlot={{ ...dish.imageSlot, ratio: "4/5" }}
                    href="/menu"
                  />
                ))}
              </StaggerGroup>
            </Grid>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <Panel glow>
              <SplitPanel
                left={
                  <div>
                    <p className="lbl">{story.eyebrowEn}</p>
                    <h2 style={{ marginBlockStart: 18 }}>
                      {story.headlineEn.replace(story.emphasisEn ?? "", "")}
                      {story.emphasisEn ? <em>{story.emphasisEn}</em> : null}
                    </h2>
                    <p className="lede" style={{ marginBlockStart: 22, maxWidth: "52ch" }}>
                      {story.subEn}
                    </p>
                    <div style={{ marginBlockStart: 30 }}>
                      <Button variant="outline" size="md" href={story.ctaHref ?? "/about"}>
                        {story.ctaLabelEn}
                      </Button>
                    </div>
                  </div>
                }
                right={<StatsList items={storyStats} />}
              />
            </Panel>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="split-even" style={{ display: "grid", gap: "clamp(28px,4.5vw,64px)", alignItems: "center" }}>
              <ImageSlot ratio="4/3" tone="cream" label="Breakfast platter photo" />
              <div>
                <p className="lbl">{breakfast.eyebrowEn}</p>
                <h2 style={{ marginBlockStart: 18 }}>
                  {breakfast.headlineEn.replace(breakfast.emphasisEn ?? "", "")}
                  {breakfast.emphasisEn ? <em>{breakfast.emphasisEn}</em> : null}
                </h2>
                <p className="lede" style={{ marginBlockStart: 22 }}>
                  {breakfast.subEn}
                </p>
                <div className="acts" style={{ marginBlockStart: 30 }}>
                  <Button variant="gold" size="md" href={breakfast.ctaHref ?? "/menu"}>
                    {breakfast.ctaLabelEn}
                  </Button>
                  <Button variant="outline" size="md" href="/reservations">
                    {t("reserveMorningTable")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <SectionHead
              eyebrow={occasions.eyebrowEn ?? ""}
              headline={occasions.headlineEn}
              emphasis={occasions.emphasisEn ?? undefined}
              lede={occasions.subEn ?? undefined}
            />
            <Grid cols={3}>
              <StaggerGroup>
                {occasionValues.map((value) => (
                  <ValueCard key={value.title} {...value} />
                ))}
              </StaggerGroup>
            </Grid>
          </div>
        </section>

        <section>
          <div className="wrap">
            <SectionHead
              eyebrow={testimonialsBlock.eyebrowEn ?? ""}
              headline={testimonialsBlock.headlineEn}
              emphasis={testimonialsBlock.emphasisEn ?? undefined}
              lede={testimonialsBlock.subEn ?? undefined}
            />
            <Grid cols={3}>
              <StaggerGroup>
                {testimonials.map((item) => (
                  <TestimonialCard
                    key={item.author}
                    stars={item.rating ?? 5}
                    quote={item.quoteEn}
                    author={item.author}
                    source={item.source}
                  />
                ))}
              </StaggerGroup>
            </Grid>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <Panel glow>
              <SplitPanel
                left={
                  <div>
                    <p className="lbl">{delivery.eyebrowEn}</p>
                    <h2 style={{ marginBlockStart: 18 }}>
                      {delivery.headlineEn.replace(delivery.emphasisEn ?? "", "")}
                      {delivery.emphasisEn ? <em>{delivery.emphasisEn}</em> : null}
                    </h2>
                    <p className="lede" style={{ marginBlockStart: 22, maxWidth: "50ch" }}>
                      {delivery.subEn}
                    </p>
                    <div className="acts" style={{ marginBlockStart: 30 }}>
                      <Button variant="gold" size="md" href={delivery.ctaHref ?? "#"}>
                        {delivery.ctaLabelEn}
                      </Button>
                      <Button variant="outline" size="md" href="https://www.elmenus.com/cairo/pascca-xvvo3">
                        {t("orderElmenus")}
                      </Button>
                    </div>
                  </div>
                }
                right={<StatsList items={deliveryStats} />}
              />
            </Panel>
          </div>
        </section>

        <section>
          <div className="wrap" style={{ display: "grid", gridTemplateColumns: ".8fr 1.2fr", gap: "clamp(28px,5vw,80px)", alignItems: "start" }}>
            <div>
              <p className="lbl">{faqBlock.eyebrowEn}</p>
              <h2 style={{ marginBlockStart: 18 }}>
                {faqBlock.headlineEn.replace(faqBlock.emphasisEn ?? "", "")}
                {faqBlock.emphasisEn ? <em>{faqBlock.emphasisEn}</em> : null}
              </h2>
              <p className="lede" style={{ marginBlockStart: 20 }}>
                {faqBlock.subEn}
              </p>
              <div style={{ marginBlockStart: 26 }}>
                <Button variant="outline" size="md" href={faqBlock.ctaHref ?? "/contact"}>
                  {faqBlock.ctaLabelEn}
                </Button>
              </div>
            </div>
            <div>
              <Accordion>
                {faq.map((item, i) => (
                  <AccordionItem
                    key={item.questionEn}
                    id={`home-faq-${i}`}
                    question={item.questionEn}
                    defaultOpen={i === 0}
                  >
                    {item.answerEn}
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <Panel glow>
              <div style={{ textAlign: "center" }}>
                <p className="lbl">{reservationCta.eyebrowEn}</p>
                <h2 style={{ margin: "18px auto 0", maxWidth: "16ch" }}>
                  {reservationCta.headlineEn.replace(reservationCta.emphasisEn ?? "", "")}
                  {reservationCta.emphasisEn ? <em>{reservationCta.emphasisEn}</em> : null}
                </h2>
                <p className="lede" style={{ margin: "22px auto 0" }}>
                  {reservationCta.subEn}
                </p>
                <div className="acts" style={{ justifyContent: "center", marginBlockStart: 32 }}>
                  <Button variant="gold" size="md" href={reservationCta.ctaHref ?? "/reservations"}>
                    {reservationCta.ctaLabelEn}
                  </Button>
                  <Button variant="outline" size="md" href={`tel:${branches[0]?.phone.replace(/\s+/g, "") ?? ""}`}>
                    {t("callPhone", { phone: branches[0]?.phone ?? "" })}
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
