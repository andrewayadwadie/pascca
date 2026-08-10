// Seed module: GalleryAlbum, GalleryImage (T032). Albums upserted on `slug`; images have no
// natural key, so they upsert on a seed-owned synthetic slug-like key baked into the URL instead
// (research R6's pattern applied to an entity the plan didn't name a key for).
//
// Article 13 [NN]: exactly the four albums named in the constitution. Article 20 [NN]: every
// image carries a non-empty `altEn`, explicit `width`/`height` (zero CLS), and a `blurHash`.
// These are seed fixtures, not real uploads — the URLs point at a plausible future R2 path, not
// a file that exists yet.
import type { PrismaClient } from "@prisma/client";
import type { SeededBranches } from "./branches";

const PLACEHOLDER_BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

interface ImageSeed {
  key: string; // unique within the album — used to build both the URL and the upsert identity
  altEn: string;
  branch?: "shobra" | "heliopolis";
}

interface AlbumSeed {
  slug: string;
  titleEn: string;
  descriptionEn: string;
  images: ImageSeed[];
}

const ALBUMS: AlbumSeed[] = [
  {
    slug: "the-food",
    titleEn: "The Food",
    descriptionEn: "What actually comes out of the kitchen.",
    images: [
      { key: "margherita-01", altEn: "A Margherita pizza fresh out of the stone oven" },
      { key: "tartufo-01", altEn: "Tagliatelle al Tartufo, close up, steam still rising" },
      { key: "calzone-01", altEn: "A calzone cut open, cheese pulling apart" },
      { key: "tiramisu-01", altEn: "A slice of tiramisu with a dusting of cocoa" },
      { key: "antipasti-01", altEn: "A shared starter plate — bruschetta and caprese" },
      { key: "grill-01", altEn: "The mixed grill, plated for two" },
    ],
  },
  {
    slug: "the-rooms",
    titleEn: "The Rooms",
    descriptionEn: "Where you'll actually be sitting.",
    images: [
      {
        key: "shobra-dining-01",
        altEn: "The main dining room at the Shobra branch",
        branch: "shobra",
      },
      { key: "shobra-oven-01", altEn: "The stone oven at Shobra, mid-service", branch: "shobra" },
      {
        key: "heliopolis-dining-01",
        altEn: "The dining room at the Heliopolis branch",
        branch: "heliopolis",
      },
      {
        key: "heliopolis-terrace-01",
        altEn: "The terrace seating at Heliopolis in the evening",
        branch: "heliopolis",
      },
      { key: "bar-01", altEn: "The espresso bar" },
      { key: "entrance-01", altEn: "The entrance, gold signage lit up at night" },
    ],
  },
  {
    slug: "breakfast",
    titleEn: "Breakfast",
    descriptionEn: "Mornings, done properly.",
    images: [
      { key: "spread-01", altEn: "The full Pascca Breakfast spread" },
      { key: "shakshuka-01", altEn: "Shakshuka in the pan, straight off the stove" },
      { key: "croissant-01", altEn: "A warm croissant with jam and butter" },
      { key: "coffee-01", altEn: "A cappuccino with latte art" },
      { key: "toast-01", altEn: "Avocado toast on sourdough" },
      { key: "juice-01", altEn: "A glass of fresh orange juice" },
    ],
  },
  {
    slug: "occasions",
    titleEn: "Occasions",
    descriptionEn: "Birthdays, engagements, family tables — we've hosted them all.",
    images: [
      { key: "birthday-01", altEn: "A birthday table set up with a cake and candles" },
      { key: "engagement-01", altEn: "A table decorated for an engagement dinner" },
      { key: "family-01", altEn: "A large family table mid-celebration" },
      { key: "group-01", altEn: "A group of friends sharing a pizza night" },
      { key: "toast-02", altEn: "Glasses raised in a toast" },
      { key: "reserved-01", altEn: "A reserved table set and ready before guests arrive" },
    ],
  },
];

export async function seedGallery(prisma: PrismaClient, branches: SeededBranches): Promise<void> {
  for (const [albumIndex, album] of ALBUMS.entries()) {
    const albumRow = await prisma.galleryAlbum.upsert({
      where: { slug: album.slug },
      update: {},
      create: {
        slug: album.slug,
        titleEn: album.titleEn,
        descriptionEn: album.descriptionEn,
        sortOrder: albumIndex,
      },
    });

    for (const [imageIndex, image] of album.images.entries()) {
      const url = `https://media.pascca.com/gallery/${album.slug}/${image.key}.jpg`;
      const branchId = image.branch
        ? image.branch === "shobra"
          ? branches.shobraId
          : branches.heliopolisId
        : null;

      await prisma.galleryImage.upsert({
        where: { url },
        update: { albumId: albumRow.id, branchId, altEn: image.altEn, sortOrder: imageIndex },
        create: {
          albumId: albumRow.id,
          branchId,
          url,
          blurHash: PLACEHOLDER_BLURHASH,
          width: 1600,
          height: 1067,
          altEn: image.altEn,
          sortOrder: imageIndex,
        },
      });
    }
  }
}
