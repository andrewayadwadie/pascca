// Seed module: PageSeo, PageBlock (T034, refactored T109). PageSeo upserted on `page`;
// PageBlock on `[page, block]` (research R6).
//
// 004-web-design-system-port (FR-022, research R7/R8): every block's headline/eyebrow/sub/cta
// copy now imports from `@pascca/web/content/page-blocks` instead of this module's own
// pre-written (on-brand but different) copy — the Governing Rule requires files/site's literal
// text, not a paraphrase of it. `PageBlock.value`'s JSON shape gains `emphasisEn`/`emphasisAr`
// (the gold-italic headline convention, FR-011) — additive to the JSON blob, not a schema
// change.
import type { PrismaClient } from "@prisma/client";
import { pageBlocks, pageSeo } from "@pascca/web/content/page-blocks";

export async function seedPageContent(prisma: PrismaClient): Promise<void> {
  for (const seo of pageSeo) {
    await prisma.pageSeo.upsert({
      where: { page: seo.page },
      update: {},
      create: {
        page: seo.page,
        titleEn: seo.titleEn,
        descriptionEn: seo.descriptionEn,
      },
    });
  }

  for (const block of pageBlocks) {
    const value = {
      headlineEn: block.headlineEn,
      headlineAr: block.headlineAr,
      emphasisEn: block.emphasisEn,
      emphasisAr: block.emphasisAr,
      eyebrowEn: block.eyebrowEn,
      eyebrowAr: block.eyebrowAr,
      subEn: block.subEn,
      subAr: block.subAr,
      ctaLabelEn: block.ctaLabelEn,
      ctaLabelAr: block.ctaLabelAr,
    };

    await prisma.pageBlock.upsert({
      where: { page_block: { page: block.page, block: block.block } },
      update: { value, ctaHref: block.ctaHref, sortOrder: block.sortOrder },
      create: {
        page: block.page,
        block: block.block,
        value,
        ctaHref: block.ctaHref,
        sortOrder: block.sortOrder,
      },
    });
  }
}
