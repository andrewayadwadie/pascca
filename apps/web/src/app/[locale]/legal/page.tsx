// US4 — Legal. Privacy notice + terms, transcribed verbatim from files/site/legal.html. The
// rich multi-section body (5 privacy subsections + 4 terms subsections) has no PageBlock field
// for that much text — it's page-local structured data here, not invented copy (see
// content/page-blocks.ts's header comment on this pattern).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPageBlocks, getPageSeo } from "../../../lib/content";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { MobileCtaBar } from "../../../components/MobileCtaBar";
import { PageHero } from "../../../components/PageHero";

function findBlock(blocks: ReturnType<typeof getPageBlocks>, key: string) {
  const block = blocks.find((b) => b.block === key);
  if (!block) throw new Error(`Legal page: missing seeded default for block "${key}" (FR-023)`);
  return block;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = getPageSeo("legal");
  return { title: seo?.titleEn, description: seo?.descriptionEn };
}

const PRIVACY_SECTIONS = [
  {
    heading: "What we collect",
    body: "When you book a table we collect your name, mobile number, email address if you give one, and the details of the booking itself. When you send a message we collect the same contact details plus what you wrote.",
  },
  {
    heading: "Why we keep it",
    body: "Only to manage your reservation or answer your message. Our branch managers see it in an internal dashboard. We do not sell it, we do not share it with advertisers, and we do not add you to a mailing list unless you ask.",
  },
  {
    heading: "How long we keep it",
    body: "Reservation records are kept for twelve months so we can recognise returning guests and resolve disputes. Contact messages are kept for six months. After that they are deleted.",
  },
  {
    heading: "Your choices",
    body: "Email Pasccapizzeria@gmail.com to see what we hold about you, correct it, or have it deleted. We will action it within thirty days.",
  },
  {
    heading: "Cookies",
    body: "This site uses only the cookies needed to keep it working and to count visits in aggregate. No advertising or cross-site tracking cookies are set.",
  },
];

const TERMS_SECTIONS = [
  {
    heading: "Reservations",
    body: "A confirmed booking holds your table for fifteen minutes past the chosen time. Bookings for more than six guests are a request until a member of staff confirms them by phone. We may cancel a booking if the branch is closed for a private event, and we will call you if that happens.",
  },
  {
    heading: "Menu and prices",
    body: "Prices shown here are kept current but may change, and dishes occasionally sell out. The price at the table is the price that applies. Allergen information is a guide — our kitchen handles gluten, dairy, nuts and shellfish, so tell your server about any allergy before ordering.",
  },
  {
    heading: "Photographs",
    body: "Images on this site are our own or published with permission. Guest reviews are reproduced with the reviewer's consent. If you see something of yours here that you would rather we removed, email us and we will take it down.",
  },
  {
    heading: "Delivery",
    body: "Delivery orders placed through talabat or elmenus are governed by those platforms' terms, not ours.",
  },
];

export default async function LegalPage() {
  const blocks = getPageBlocks("legal");
  const hero = findBlock(blocks, "hero");
  const privacy = findBlock(blocks, "privacy");
  const terms = findBlock(blocks, "terms");
  const tNav = await getTranslations("nav");
  const draftNote = "Draft only — have a lawyer review before launch";

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <PageHero crumb={tNav("legalCrumb")} headline={hero.headlineEn} emphasis={hero.emphasisEn ?? undefined} lede={hero.subEn ?? undefined} />

        <section>
          <div className="wrap" style={{ maxWidth: 820 }}>
            <div>
              <p className="lbl">{privacy.eyebrowEn}</p>
              <h2 style={{ marginBlockStart: 18, fontSize: "clamp(26px,3vw,40px)" }}>
                {privacy.headlineEn.replace(privacy.emphasisEn ?? "", "")}
                {privacy.emphasisEn ? <em>{privacy.emphasisEn}</em> : null}
              </h2>
              {PRIVACY_SECTIONS.map((section) => (
                <div key={section.heading}>
                  <h3 style={{ marginBlockStart: 40, fontSize: 22 }}>{section.heading}</h3>
                  <p className="lede" style={{ maxWidth: "none", marginBlockStart: 12 }}>
                    {section.body}
                  </p>
                </div>
              ))}
            </div>

            <hr style={{ border: 0, borderBlockStart: "1px solid var(--w06)", margin: "60px 0" }} />

            <div id="terms">
              <p className="lbl">{terms.eyebrowEn}</p>
              <h2 style={{ marginBlockStart: 18, fontSize: "clamp(26px,3vw,40px)" }}>
                {terms.headlineEn.replace(terms.emphasisEn ?? "", "")}
                {terms.emphasisEn ? <em>{terms.emphasisEn}</em> : null}
              </h2>
              {TERMS_SECTIONS.map((section) => (
                <div key={section.heading}>
                  <h3 style={{ marginBlockStart: 40, fontSize: 22 }}>{section.heading}</h3>
                  <p className="lede" style={{ maxWidth: "none", marginBlockStart: 12 }}>
                    {section.body}
                  </p>
                </div>
              ))}
              <p className="note" style={{ marginBlockStart: 44 }}>
                {draftNote}
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
