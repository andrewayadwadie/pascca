// US4 — About.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getMilestones, getPageBlocks, getPageSeo, getTeam } from "../../../lib/content";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { MobileCtaBar } from "../../../components/MobileCtaBar";
import { PageHero } from "../../../components/PageHero";
import { SectionHead } from "../../../components/SectionHead";
import { Grid } from "../../../components/Grid";
import { StaggerGroup } from "../../../components/StaggerGroup";
import { ValueCard } from "../../../components/ValueCard";
import { Panel } from "../../../components/Panel";
import { StatsList } from "../../../components/StatsList";
import { Button } from "../../../components/Button";
import { ImageSlot } from "../../../components/ImageSlot";

function findBlock(blocks: ReturnType<typeof getPageBlocks>, key: string) {
  const block = blocks.find((b) => b.block === key);
  if (!block) throw new Error(`About page: missing seeded default for block "${key}" (FR-023)`);
  return block;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = getPageSeo("about");
  return { title: seo?.titleEn, description: seo?.descriptionEn };
}

export default async function AboutPage() {
  const blocks = getPageBlocks("about");
  const hero = findBlock(blocks, "hero");
  const story = findBlock(blocks, "story");
  const values = findBlock(blocks, "values");
  const milestonesBlock = findBlock(blocks, "milestones");
  const team = findBlock(blocks, "team");
  const cta = findBlock(blocks, "cta");
  const milestones = getMilestones();
  const teamMembers = getTeam();
  const tNav = await getTranslations("nav");
  const tCta = await getTranslations("cta");

  // Page-local extended copy — about.html's story section has two supporting paragraphs and a
  // pull-quote beyond the one subEn field PageBlock carries (see content/page-blocks.ts header
  // comment). Transcribed verbatim from the source, not reworded.
  const storyParagraph1 =
    "People come here for a Friday breakfast that runs three hours, for a first date, for a birthday nobody wants to leave. The food has to be good enough to hold them there — so the dough is proved properly, the sauce is made every morning, and produce arrives daily rather than weekly.";
  const storyParagraph2 = "Nothing about that changed when we opened Heliopolis. It just gave us a bigger room and a longer morning.";
  const yearsBadgeValue = "8+";
  const yearsBadgeLabel = "Years in Cairo";

  const valueCards = [
    { icon: "◷", title: "The dough", description: "Proved properly before it ever meets the stone. It's the difference between pizza that sits heavy and pizza you finish." },
    { icon: "✿", title: "The produce", description: "Delivered daily, not weekly. Sauce made in-house every morning — never opened from a tin." },
    { icon: "◈", title: "The choice", description: "Fasting and vegetarian dishes made to the same standard as everything else, marked clearly, available all year." },
    { icon: "♡", title: "The welcome", description: "The most repeated line in our reviews is about the staff. That isn't luck — it's who we hire and how long they stay." },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <PageHero crumb={tNav("about")} headline={hero.headlineEn} emphasis={hero.emphasisEn ?? undefined} lede={hero.subEn ?? undefined} />

        <section>
          <div className="wrap" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(28px,5vw,72px)", alignItems: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
              <div style={{ marginBlockStart: 52 }}>
                <ImageSlot ratio="1/1" tone="warm" label="Kitchen photo" />
              </div>
              <ImageSlot ratio="3/4" tone="cream" label="Dining room photo" />
              <div style={{ background: "var(--gold)", color: "var(--black)", borderRadius: "var(--r)", padding: 24, gridColumn: 1 }}>
                <b className="serif" style={{ fontSize: 44, display: "block", lineHeight: 1 }}>
                  {yearsBadgeValue}
                </b>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBlockStart: 8, opacity: 0.72 }}>
                  {yearsBadgeLabel}
                </span>
              </div>
            </div>
            <div>
              <p className="lbl">{story.eyebrowEn}</p>
              <h2 style={{ marginBlockStart: 18 }}>
                {story.headlineEn.replace(story.emphasisEn ?? "", "")}
                {story.emphasisEn ? <em>{story.emphasisEn}</em> : null}
              </h2>
              <blockquote
                className="serif"
                style={{ fontStyle: "italic", fontWeight: 400, fontSize: "clamp(20px,2.3vw,27px)", lineHeight: 1.55, borderInlineStart: "1px solid var(--gold)", paddingInlineStart: 24, margin: "30px 0" }}
              >
                {story.subEn}
              </blockquote>
              <p className="lede" style={{ maxWidth: "50ch" }}>
                {storyParagraph1}
              </p>
              <p className="lede" style={{ maxWidth: "50ch", marginBlockStart: 18 }}>
                {storyParagraph2}
              </p>
            </div>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <SectionHead eyebrow={values.eyebrowEn ?? ""} headline={values.headlineEn} emphasis={values.emphasisEn ?? undefined} />
            <Grid cols={4}>
              <StaggerGroup>
                {valueCards.map((v) => (
                  <ValueCard key={v.title} {...v} />
                ))}
              </StaggerGroup>
            </Grid>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <Panel glow>
              <p className="lbl">{milestonesBlock.eyebrowEn}</p>
              <h2 style={{ marginBlockStart: 18, maxWidth: "14ch" }}>
                {milestonesBlock.headlineEn.replace(milestonesBlock.emphasisEn ?? "", "")}
                {milestonesBlock.emphasisEn ? <em>{milestonesBlock.emphasisEn}</em> : null}
              </h2>
              <div style={{ marginBlockStart: 34 }}>
                <StatsList
                  items={milestones.map((m) => ({
                    label: `${m.year} · ${m.titleEn}`,
                    value: m.badge,
                  }))}
                />
              </div>
            </Panel>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <SectionHead eyebrow={team.eyebrowEn ?? ""} headline={team.headlineEn} emphasis={team.emphasisEn ?? undefined} lede={team.subEn ?? undefined} />
            <Grid cols={3}>
              <StaggerGroup>
                {teamMembers.map((member) => (
                  <article className="dish" key={member.slug}>
                    <ImageSlot {...member.imageSlot} />
                    <div className="body">
                      <h3>{member.roleEn}</h3>
                      <p style={{ marginBlockStart: 8 }}>{member.bioEn}</p>
                    </div>
                  </article>
                ))}
              </StaggerGroup>
            </Grid>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <Panel glow>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ margin: "0 auto", maxWidth: "16ch" }}>
                  {cta.headlineEn.replace(cta.emphasisEn ?? "", "")}
                  {cta.emphasisEn ? <em>{cta.emphasisEn}</em> : null}
                </h2>
                <div className="acts" style={{ justifyContent: "center", marginBlockStart: 30 }}>
                  <Button variant="gold" size="md" href={cta.ctaHref ?? "/reservations"}>
                    {cta.ctaLabelEn}
                  </Button>
                  <Button variant="outline" size="md" href="/gallery">
                    {tCta("viewGallery")}
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
