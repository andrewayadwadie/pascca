// US3 — Reservations. Form submits nowhere; ReservationForm owns the local confirmed/
// call-required split (FR-033/FR-034).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getFaq, getPageBlocks, getPageSeo, getBranches } from "../../../lib/content";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { MobileCtaBar } from "../../../components/MobileCtaBar";
import { PageHero } from "../../../components/PageHero";
import { Panel } from "../../../components/Panel";
import { ReservationForm } from "../../../components/ReservationForm";
import { Accordion } from "../../../components/Accordion";
import { AccordionItem } from "../../../components/AccordionItem";
import { Button } from "../../../components/Button";

function findBlock(blocks: ReturnType<typeof getPageBlocks>, key: string) {
  const block = blocks.find((b) => b.block === key);
  if (!block) throw new Error(`Reservations page: missing seeded default for block "${key}" (FR-023)`);
  return block;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = getPageSeo("reservations");
  return { title: seo?.titleEn, description: seo?.descriptionEn };
}

export default async function ReservationsPage() {
  const blocks = getPageBlocks("reservations");
  const hero = findBlock(blocks, "hero");
  const howItWorks = findBlock(blocks, "how-it-works");
  const bookingFaq = findBlock(blocks, "booking-faq");
  const faq = getFaq("reservations");
  const branches = getBranches();
  const tNav = await getTranslations("nav");
  const tCta = await getTranslations("cta");

  const steps = [
    { n: "01", label: "Pick a branch and a time" },
    { n: "02", label: "Tell us the occasion" },
    { n: "03", label: "Get your confirmation" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.questionEn,
      acceptedAnswer: { "@type": "Answer", text: item.answerEn },
    })),
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <PageHero crumb={tNav("reservations")} headline={hero.headlineEn} emphasis={hero.emphasisEn ?? undefined} lede={hero.subEn ?? undefined} />

        <section>
          <div className="wrap" style={{ display: "grid", gridTemplateColumns: ".8fr 1.2fr", gap: "clamp(28px,5vw,72px)", alignItems: "start" }}>
            <div>
              <p className="lbl">{howItWorks.eyebrowEn}</p>
              <h2 style={{ marginBlockStart: 18, fontSize: "clamp(28px,3.4vw,44px)" }}>
                {howItWorks.headlineEn.replace(howItWorks.emphasisEn ?? "", "")}
                {howItWorks.emphasisEn ? <em>{howItWorks.emphasisEn}</em> : null}
              </h2>
              <div style={{ marginBlockStart: 30 }}>
                {steps.map((step) => (
                  <div className="row" key={step.n} style={{ borderBlockStart: 0 }}>
                    <span>{step.n}</span>
                    <b style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--w)" }}>{step.label}</b>
                  </div>
                ))}
              </div>
              <p className="lede" style={{ marginBlockStart: 30 }}>
                {howItWorks.subEn}
              </p>
              <div className="acts" style={{ marginBlockStart: 26 }}>
                <Button variant="outline" size="sm" href="tel:01025070801">
                  {tCta("groupsOver8")}
                </Button>
              </div>
            </div>

            <Panel>
              <ReservationForm branchOptions={branches.map((b) => `${b.nameEn} — ${b.addressEn}`)} />
            </Panel>
          </div>
        </section>

        <section className="tight">
          <div className="wrap" style={{ display: "grid", gridTemplateColumns: ".8fr 1.2fr", gap: "clamp(28px,5vw,72px)", alignItems: "start" }}>
            <div>
              <p className="lbl">{bookingFaq.eyebrowEn}</p>
              <h2 style={{ marginBlockStart: 18, fontSize: "clamp(26px,3vw,40px)" }}>
                {bookingFaq.headlineEn.replace(bookingFaq.emphasisEn ?? "", "")}
                {bookingFaq.emphasisEn ? <em>{bookingFaq.emphasisEn}</em> : null}
              </h2>
            </div>
            <Accordion>
              {faq.map((item, i) => (
                <AccordionItem key={item.questionEn} id={`reservations-faq-${i}`} question={item.questionEn} defaultOpen={i === 0}>
                  {item.answerEn}
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileCtaBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
