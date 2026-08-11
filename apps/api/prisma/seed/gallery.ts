// Seed module: GalleryAlbum, GalleryImage (T032, refactored T108).
//
// 004-web-design-system-port (FR-022, research R7/R8): albums/images now import from
// `@pascca/web/content/gallery` instead of a second hand-written copy. The fixture's
// `imageSlot.label` is the closest equivalent to `altEn` files/site actually has (there is no
// separate alt-text field in the static markup) — Article 20 [NN] still requires a non-empty
// `altEn`, which the label satisfies. `url`/`blurHash`/`width`/`height` have no fixture
// equivalent (files/site has no real photography yet either) and stay seed-local placeholders,
// same as before this refactor.
import type { PrismaClient } from "@prisma/client";
import { galleryAlbums } from "@pascca/web/content/gallery";

const PLACEHOLDER_BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export async function seedGallery(prisma: PrismaClient): Promise<void> {
  for (const [albumIndex, album] of galleryAlbums.entries()) {
    const albumRow = await prisma.galleryAlbum.upsert({
      where: { slug: album.slug },
      update: {},
      create: {
        slug: album.slug,
        titleEn: album.titleEn,
        titleAr: album.titleAr,
        sortOrder: albumIndex,
      },
    });

    for (const [imageIndex, image] of album.images.entries()) {
      const url = `https://media.pascca.com/gallery/${album.slug}/${imageIndex}.jpg`;

      await prisma.galleryImage.upsert({
        where: { url },
        update: { albumId: albumRow.id, altEn: image.imageSlot.label, sortOrder: imageIndex },
        create: {
          albumId: albumRow.id,
          url,
          blurHash: PLACEHOLDER_BLURHASH,
          width: 1600,
          height: 1067,
          altEn: image.imageSlot.label,
          sortOrder: imageIndex,
        },
      });
    }
  }
}
