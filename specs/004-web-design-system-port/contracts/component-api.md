# Contract: Component Prop API

This is the interface later features are told to rely on (Section 3 of the input: "Use exactly
these names so the later features can refer to them"). Treat every signature below as frozen
once shipped — a later feature narrowing or renaming a prop here is a breaking change to this
contract, the UI equivalent of Article 9's API versioning discipline.

All components live under `apps/web/src/components/`, one file per component, PascalCase
matching the name below exactly.

## Chrome

| Component | Props | Notes |
|---|---|---|
| `SiteHeader` | none (reads current route internally for `aria-current`) | Owns the sticky/`small` scroll-triggered state (FR-027) |
| `MobileNavOverlay` | `open: boolean; onClose: () => void` | Clip-path wipe, focus trap, scroll lock (FR-028, FR-037) |
| `MobileCtaBar` | none | Fixed, shown ≤1100px (Article 17) |
| `SiteFooter` | none | |

## Typography / layout primitives

| Component | Props | Notes |
|---|---|---|
| `Button` | `variant: "white" \| "gold" \| "outline"; size: "md" \| "sm"; href?: string; onClick?: () => void; type?: "button" \| "submit"; children: ReactNode` | Renders `<a>` if `href` given, else `<button>` |
| `Eyebrow` | `children: ReactNode` | `.lbl` — uppercase, letter-spaced label |
| `SectionHead` | `eyebrow: string; headline: string; emphasis?: string; lede?: string` | `emphasis` is the substring of `headline` rendered gold-italic (FR-011) |
| `Lede` | `children: ReactNode; width?: "full" \| "70" \| "60"` | Maps to `--w`/`--w70`/`--w60` (FR-041) |
| `FootNote` | `children: ReactNode` | `.note` |
| `PageHero` | `crumb: string; headline: string; emphasis?: string; lede?: string` | `.phero` |
| `Grid` | `cols: 2 \| 3 \| 4; children: ReactNode` | |

## Home hero

| Component | Props |
|---|---|
| `HomeHero` | `eyebrow: string; headline: string; emphasis?: string; lede: string; primaryCta: {label:string; href:string}; secondaryCta: {label:string; href:string}; stats: {value:string; label:string}[]` |
| `FloatingPlate` | `imageSlot: ImageSlotProps` |
| `FloatingBadge` | `icon: string; title: string; subtitle: string; rotate?: number` |

## Media

| Component | Props |
|---|---|
| `ImageSlot` | `ratio: string; tone: "warm" \| "gold" \| "stone" \| "ember" \| "herb" \| "cream"; label: string; badge?: string; src?: string; alt?: string` | `src`/`alt` unused today — present now so wiring `next/image` later is additive, not a signature change (FR-013) |

## Content cards

| Component | Props |
|---|---|
| `DishCard` | `name: string; priceLabel: string; description: string; imageSlot: ImageSlotProps; badge?: string; href: string` |
| `GoldLink` | `href: string; children: ReactNode` |
| `MenuRow` | `name: string; description: string; priceLabel: string; chips: {label:string; variant:"fasting"\|"veg"}[]; imageSlot: ImageSlotProps` |
| `Chip` | `variant: "fasting" \| "veg"; children: ReactNode` |
| `ValueCard` | `icon: string; title: string; description: string` |
| `TestimonialCard` | `stars: number; quote: string; author: string; source: string` |
| `BranchCard` | `name: string; badge: string; imageSlot: ImageSlotProps; address: string; rows: {label:string; value:string}[]; primaryCta:{label:string;href:string}; secondaryCta:{label:string;href:string}` |
| `DetailRows` | `rows: {label:string; value:string}[]` |

## Controlled interaction

| Component | Props |
|---|---|
| `FilterPills` | `options: {value:string; label:string}[]; value: string; onChange: (value: string) => void; resultCount?: number` | `resultCount` feeds the FR-039 live-region announcement |
| `Accordion` | `children: ReactNode` (composes `AccordionItem`s, enforces one-open via internal state, FR-030) |
| `AccordionItem` | `id: string; question: string; children: ReactNode; defaultOpen?: boolean` |
| `MasonryGrid` | `items: {imageSlot: ImageSlotProps}[]; onSelect: (index: number) => void` | `onSelect` opens the lightbox (US5) |

## Structural

| Component | Props |
|---|---|
| `Panel` | `glow?: boolean; children: ReactNode` |
| `SplitPanel` | `left: ReactNode; right: ReactNode; reverse?: boolean` |
| `StatsList` | `items: {label:string; value:string}[]` |
| `PressStrip` | `items: string[]` |

## Forms (US3)

| Component | Props |
|---|---|
| `Form` | `onSubmit: (values) => void; children: ReactNode` | React Hook Form provider wrapper |
| `Field` | `name: string; label: string; type?: string; as?: "input" \| "select" \| "textarea"; options?: string[]; required?: boolean` | Always renders a real `<label>` (FR-040) |
| `ResultBox` | `state: "idle" \| "confirmed" \| "call-required"; message: string` | The two success states from FR-034 |

## Motion

| Component | Props |
|---|---|
| `Reveal` | `children: ReactNode` | One-shot IO reveal at 12% (FR-029) |
| `StaggerGroup` | `children: ReactNode` | Wraps a `Grid` of `Reveal`-style children with staggered delay |
| `EnterGroup` | `children: ReactNode` | Hero-load stagger variant of the same primitive |

## Gold-italic headline convention (FR-011)

Any component accepting a `headline` also accepts an optional `emphasis` prop — a substring of
`headline` that must appear verbatim inside it. The component renders the portion of `headline`
before `emphasis` as plain text and `emphasis` itself inside `<em>` (gold, italic per
`tokens.css`/global styles). No page passes raw `<em>` markup as `children`; this prop is the
only path to that visual treatment, so every headline is a plain string in its content fixture.
