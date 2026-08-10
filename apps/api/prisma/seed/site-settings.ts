// Seed module: SiteSetting (T028). Upserted on `key` (research R6) — safe to re-run.
//
// No dashboard-facing *labels* live here. A label ("Delivery links") is Tier 3 UI chrome and
// belongs in messages/{en,ar}.json (Article 12 [NN]) — this table only stores the values an
// admin edits, not the words describing the field to them.
import type { PrismaClient } from "@prisma/client";

export async function seedSiteSettings(prisma: PrismaClient): Promise<void> {
  const settings: Array<{ key: string; value: unknown; group: string }> = [
    {
      key: "delivery.talabat.url",
      // TODO(client-data): placeholder link, not a verified Pascca storefront URL.
      value: "https://www.talabat.com/egypt/restaurant/pascca",
      group: "delivery",
    },
    {
      key: "delivery.elmenus.url",
      // TODO(client-data): placeholder link, not a verified Pascca storefront URL.
      value: "https://www.elmenus.com/cairo/pascca",
      group: "delivery",
    },
    {
      // Article 23: delivery is surfaced via links only until Phase 9 owns it outright.
      key: "delivery.enabled",
      value: true,
      group: "delivery",
    },
    {
      key: "social.instagram.url",
      // TODO(client-data): placeholder — the client's real handle needs confirming.
      value: "https://www.instagram.com/pascca.eg",
      group: "social",
    },
    {
      // Article 24: the blog is modelled and CRUD-able but stays off the nav until the client
      // commits to publishing.
      key: "feature.blog.enabled",
      value: false,
      group: "feature",
    },
    {
      // Article 21 [NN]: Arabic is registered, i18n-complete, and switched off at launch.
      key: "feature.locale.ar.enabled",
      value: false,
      group: "feature",
    },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value as never, group: setting.group },
      create: { key: setting.key, value: setting.value as never, group: setting.group },
    });
  }
}
