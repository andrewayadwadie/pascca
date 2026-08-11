// US4 — Gallery. Server Component (generateMetadata, FR-046); album filtering + lightbox state
// live in GalleryClient (needs the browser).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getGallery, getPageBlocks, getPageSeo } from "../../../lib/content";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { MobileCtaBar } from "../../../components/MobileCtaBar";
import { PageHero } from "../../../components/PageHero";
import { GalleryClient } from "../../../components/GalleryClient";
import { Panel } from "../../../components/Panel";
import { Button } from "../../../components/Button";

function findBlock(blocks: ReturnType<typeof getPageBlocks>, key: string) {
  const block = blocks.find((b) => b.block === key);
  if (!block) throw new Error(`Gallery page: missing seeded default for block "${key}" (FR-023)`);
  return block;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = getPageSeo("gallery");
  return { title: seo?.titleEn, description: seo?.descriptionEn };
}

export default async function GalleryPage() {
  const blocks = getPageBlocks("gallery");
  const hero = findBlock(blocks, "hero");
  const instagramCta = findBlock(blocks, "instagram-cta");
  const albums = getGallery();
  const tNav = await getTranslations("nav");

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <PageHero crumb={tNav("gallery")} headline={hero.headlineEn} emphasis={hero.emphasisEn ?? undefined} lede={hero.subEn ?? undefined} />

        <section>
          <div className="wrap">
            <GalleryClient albums={albums} />
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <Panel glow>
              <div style={{ textAlign: "center" }}>
                <p className="lbl">{instagramCta.eyebrowEn}</p>
                <h2 style={{ margin: "18px auto 0", maxWidth: "16ch" }}>
                  {instagramCta.headlineEn.replace(instagramCta.emphasisEn ?? "", "")}
                  {instagramCta.emphasisEn ? <em>{instagramCta.emphasisEn}</em> : null}
                </h2>
                <p className="lede" style={{ margin: "20px auto 0" }}>
                  {instagramCta.subEn}
                </p>
                <div className="acts" style={{ justifyContent: "center", marginBlockStart: 30 }}>
                  <Button variant="gold" size="md" href={instagramCta.ctaHref ?? "https://www.instagram.com/pasccarestaurant/"}>
                    {instagramCta.ctaLabelEn}
                  </Button>
                  <Button variant="outline" size="md" href="/reservations">
                    {tNav("bookTable")}
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
