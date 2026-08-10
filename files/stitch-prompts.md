# Pascca — Google Stitch Prompts

One prompt per screen. **Paste the Design System Preamble first in every new Stitch session**,
then a single screen prompt. Do not paste two screen prompts at once — Stitch degrades.

Screens 1–8 are the public site (already built in HTML — use Stitch here only to explore
variations or to generate the Figma layers your client wants to see). Screens 9–18 are the
**dashboard**, which has no design yet — that's where Stitch earns its keep.

---

## Design System Preamble — paste before every screen prompt

```
Design a dark, premium but warm interface for PASCCA, a cosy Italian restaurant in Cairo.
Not fine dining — a neighbourhood restaurant that takes its food seriously.

COLOURS
Background #0A0A0A. Card and panel surfaces #141414, raised surfaces #1B1B1B.
Single accent: gold #D4AF37, with #F4A460 for hover. Text white; secondary text
white at 60% opacity; tertiary at 40%; hairline borders white at 6%.
Gold is used only for: accent labels, prices, borders, icons, primary buttons and
large display words. Never gold body text.

TYPOGRAPHY
Display: Zodiak (a high-contrast serif) — headings, prices and pull quotes, weight 700,
tight tracking, with italic used for the emphasised half of a headline.
Body and UI: Plus Jakarta Sans, weights 400–700.
Uppercase eyebrow labels are 10–11px, weight 600, letter-spacing 0.35em, gold.

GEOMETRY
Corner radius 24px for cards, 32px for large panels, fully rounded pills for buttons.
Generous whitespace: 100–140px between sections, 1440px max content width.
Borders are 1px hairlines, never heavy. One soft shadow recipe for elevation only.

COMPONENTS
Primary button: gold fill, black uppercase text, pill, letter-spacing 0.16em.
Secondary button: transparent with 1px white-20% border, turns gold on hover.
Cards lift 8–10px on hover with a springy easing.
Navigation is a sticky glassmorphism bar: #0A0A0A at 95% with 10px backdrop blur,
brand wordmark centred with a small gold "RISTORANTE" sub-label at 0.4em tracking.

TONE
Warm, plain, slightly funny. Prices are always visible. Never imply expensive.
```

---

# PART A — Public site

## 1. Home

```
Design the home page for PASCCA.

HERO: full viewport, two columns. Left column: gold uppercase eyebrow
"Heliopolis & Shobra · Cairo"; a very large serif headline "Freshly baked" with
"with love" on a second line in italic; a paragraph in white-60%; two pill buttons
("Book a table" white fill, "See the menu" outlined); and a row of three statistics
(19K Instagram family / 4.5★ 4,829 delivery reviews / 2 Cairo branches) where the
number is large gold serif and the label is tiny uppercase white-40%.
Right column: a large circular food photograph, about 550px, floating in 3D space with
a heavy drop shadow and a soft gold radial glow behind it. Two small floating cards
overlap it — one reading "4.7 on Restaurant Guru / 135 reviews" with a gold star, and
one rotated -6 degrees reading "Best calzone in Cairo / Guest review".

Then a thin horizontal strip of press names in white-20% serif.

SIGNATURE DISHES: section label "Most loved", headline "Dishes people come back for".
Four cards in a row, alternating vertical offset. Each card: a 4:5 food photograph on
top with an optional small gold-outlined pill badge in the corner, then dish name in
serif, price in gold serif on the same line, a two-line description in white-50%, and
a gold "View dish" link with a circled arrow.

STORY PANEL: a wide #141414 panel with 32px corners and a faint gold glow bleeding from
the top-right corner. Left: label "Our story", headline "A pizzeria that grew into a room",
paragraph, outlined button. Right: a vertical list of four statistic rows separated by
hairlines — label on the left in tiny uppercase, value on the right in gold serif.

BREAKFAST: two columns — a 4:3 photograph on one side, and on the other a label
"Mornings", headline "Breakfast, unhurried", paragraph and two buttons.

OCCASIONS: three bordered cards, each with a round gold-tinted icon circle, a title and
two lines of copy — Birthdays, Engagements & dates, Groups over 8.

TESTIMONIALS: three cards on #141414 with five gold stars, an italic serif quote, and a
footer row with a circular avatar, a name and a source in white-40%.

DELIVERY: another wide panel — headline "We deliver across Cairo", paragraph, two buttons
for talabat and elmenus, and a statistics list on the right.

FAQ: two columns — left is a label, headline and outlined button; right is an accordion of
five questions with a gold arrow that rotates 90 degrees when open.

CLOSING CTA: a centred panel with a serif headline and two buttons.

FOOTER: four columns on #0A0A0A above a hairline — large serif wordmark with the gold
sub-label and a short mission paragraph; a links column; an "Hours of service" column
where each row has the label left and the value right; and a "Visit us" column with small
gold icons for address, phone and email. Bottom bar: small uppercase legal links on the
left in white-20%, copyright on the right.

Also design the mobile version, including a fixed floating pill at the bottom of the screen
containing two equal buttons — "Menu" in white and "Book" in gold, both uppercase.
```

## 2. Menu

```
Design the menu page for PASCCA.

PAGE HERO: a compact hero, not full screen. A tiny uppercase breadcrumb "Home — Menu" in
white-20%, a large serif headline "Everything we bake and plate" with the last two words
in gold italic, and a paragraph. A hairline separates it from the content.

FILTER BAR: a wrapping row of pill filters — Everything, Pizza, Calzone, Pasta, Mains,
Starters, Breakfast, Desserts, Drinks, then two special ones: "Fasting only" and
"Vegetarian only". Inactive pills are outlined in white-10% with white-60% text; the active
pill is solid gold with black text.

CATEGORY GROUPS: for each category, a serif sub-heading, a one-line description in
white-50%, then a list of dish rows. Each row is a horizontal layout: a small 96px square
photograph with 14px corners, then the dish name in serif with small outlined chips beside
it ("Fasting" in gold outline, "Veg" in white outline), a description line in white-50%
below, and the price on the far right in large gold serif. Rows are separated by hairlines
and shift 10px to the right on hover.

Show eight groups: pizza, calzone, pasta, mains, starters and sides, breakfast, desserts,
drinks. Prices are always visible.

Close with a centred panel: "Seen something you want?" and two buttons — "Book a table"
in gold and "Order delivery" outlined.

Reuse the same navigation, footer and mobile floating bar as the home page.
```

## 3. About

```
Design the about page for PASCCA.

PAGE HERO with breadcrumb, headline "A pizzeria that grew into a room" and a paragraph.

STORY: two columns. Left is a bento mosaic — a 300px-tall photograph offset downward, a
400px-tall photograph beside it, and tucked underneath a solid gold card with black text
showing "8+" in huge serif and "Years in Cairo" in tiny uppercase. Right is editorial:
label "Our story", serif headline, then a large italic serif pull-quote with a gold vertical
rule on its left edge, then two paragraphs of body copy in white-50%.

VALUES: four bordered cards in a row, each with a round gold-tinted icon circle, a title
and three lines of copy — The dough, The produce, The choice, The welcome.

MILESTONES: a wide panel with a vertical list of five rows, each with a year and event on
the left in tiny uppercase and a gold serif value on the right.

TEAM: three cards, each a square portrait photograph on top with a name and role below.

Close with a centred CTA panel.
```

## 4. Gallery

```
Design the gallery page for PASCCA.

PAGE HERO with breadcrumb and headline "The food and the room".

ALBUM FILTERS: the same pill filter row — Everything, The food, The rooms, Breakfast, Occasions.

MASONRY GRID: a 12-column grid with mixed spans and aspect ratios — one 7-column 16:10, one
5-column 16:10, three 4-column 4:3, one full-width 21:7, and two 6-column 16:9. Each tile
has 24px corners and no visible caption at rest; on hover the image scales slightly and a
thin gold inset border animates inward, with the caption appearing in gold.

Clicking a tile opens a lightbox: the image centred on a near-black backdrop with 10px blur,
a caption underneath, an album chip, and left/right arrows.

Close with a centred panel inviting people to tag @pasccarestaurant on Instagram.
```

## 5. Branches

```
Design the branches page for PASCCA.

PAGE HERO with headline "Two rooms, one kitchen".

BRANCH CARDS: two large cards side by side. Each has a 16:9 photograph on top with a small
pill badge in the corner ("Since 2018" outlined white on one, "Open 24 hours" gold on the
other). Below: the branch name in large serif, the address in white-50%, then a list of
detail rows separated by hairlines — Phone, Hours, Breakfast, Google rating, Delivery area —
with tiny uppercase labels on the left and gold serif values on the right. Two buttons at
the bottom: "Call branch" gold and "Directions" outlined.

MAP: a full-width 21:8 dark map panel with 32px corners, both branches marked with gold pins.

LARGE GROUPS: a wide panel — headline "More than eight of you?", paragraph, a gold button
with the group phone number, and a statistics list on the right.
```

## 6. Reservations

```
Design the reservation page for PASCCA.

PAGE HERO with headline "Book your table in a minute" and a line explaining that parties
of six or fewer are confirmed instantly.

Two columns. LEFT (narrower): label "How it works", a serif headline, then three numbered
rows separated by hairlines — Pick a branch and a time / Tell us the occasion / Get your
confirmation. Below, a paragraph about the fifteen-minute hold, and an outlined button for
groups over eight.

RIGHT (wider): a #141414 panel with 32px corners containing a two-column form. Fields:
Full name, Mobile, Email, Branch (select), Date, Time, Guests (select), Occasion (select),
and a full-width Notes textarea. Field labels are tiny uppercase white-40% above each input.
Inputs are #0A0A0A with a 1px white-10% border and 14px corners, turning gold on focus.
A full-width gold "Confirm reservation" button, and beneath it a small privacy line.

Design the success state too: a gold-bordered box with a soft gold tint showing a booking
reference in gold serif and a confirmation line. Design a second variant for parties above
six, where the message says a member of staff will call.

Below the form, a two-column FAQ accordion about booking.
```

## 7. Contact

```
Design the contact page for PASCCA.

PAGE HERO with headline "Talk to us".

Two columns. LEFT (narrower): a statistics-style list of contact rows — Reservations,
Heliopolis, Groups & events, Email — with tiny uppercase labels left and gold values right.
Beneath it a gold "WhatsApp us" button and an outlined "Instagram" button, then a short
paragraph.

RIGHT (wider): a #141414 panel containing a form — Full name, Mobile, Email, Subject
(select), and a full-width Message textarea, with a gold submit button and a success state.

Below, two compact branch cards with hours, phone and a directions button.
```

## 8. Legal

```
Design a legal page for PASCCA covering privacy and terms.

PAGE HERO with headline "Privacy & terms" and a line inviting people to email with questions.

Content is a single centred column, maximum 820px wide, in two blocks separated by a hairline.
Each block opens with a gold uppercase label and a serif headline, then alternates serif
sub-headings with body paragraphs in white-50% at comfortable reading measure.

Restrained and highly legible — no cards, no icons, no decoration. Same nav and footer.
```

---

# PART B — Admin dashboard

Dashboard preamble addition — **append this to the Design System Preamble for screens 9–18:**

```
This is an internal admin dashboard used by restaurant managers on a laptop and
occasionally a tablet, often during a busy service. Same colours, typography and
radii as the public site, but denser: 14px base text, tighter 16-24px spacing,
data tables rather than marketing cards. Layout is a fixed 240px left sidebar with
the PASCCA wordmark at the top, grouped navigation, and the signed-in user at the
bottom. Content sits in a scrollable area with a sticky page header containing the
page title, a search field and the primary action button. Prioritise speed and
scannability over decoration.
```

## 9. Dashboard — Today

```
Design the dashboard home screen, titled "Today".

Top row: four stat cards — Covers today, Bookings pending confirmation, New messages,
Items marked unavailable. Each shows a large gold serif number, a tiny uppercase label,
and a small change indicator against yesterday.

Main area, two columns. Left (wider): "Next up" — a list of the next eight reservations
as rows showing time, guest name, party size, branch, a coloured status pill (Pending amber,
Confirmed green, Seated blue, Cancelled grey) and quick action buttons (Confirm, Seat,
No-show). Rows for parties over six carry a small gold "Call required" flag.

Right: a "Live" panel with a pulsing gold dot showing new bookings as they arrive, and
below it a compact "Needs attention" list — unanswered messages, pending large-party
requests, and dishes switched off.
```

## 10. Reservations — list

```
Design the reservations screen.

Sticky header: title, a search field (name, phone or booking reference), filter controls
for branch, date range and status, a "Today" quick chip, an "Export CSV" outlined button,
and a gold "New booking" button.

Main area: a dense data table with columns — Time, Reference, Guest, Phone, Party, Branch,
Occasion, Source, Status, and a row action menu. Status is a coloured pill. Rows are
separated by hairlines and highlight on hover. Party sizes over six show a small gold flag.

Include a segmented control to switch between Table view and Day view. Design the Day view
as a horizontal timeline of the service from opening to close, with bookings as blocks
positioned by time and sized by duration, stacked by branch.

Design the empty state and a pagination footer.
```

## 11. Reservation — detail drawer

```
Design a right-hand slide-over drawer for a single reservation, about 520px wide, over a
dimmed blurred backdrop.

Header: guest name, booking reference in gold, and a close button.
Body: an editable summary block (branch, date, time, party size, occasion), the guest's
phone and email with click-to-call and click-to-WhatsApp icons, a guest notes block, and a
separate internal "Staff notes" block visually distinguished as internal-only.

A status control showing the lifecycle as a horizontal stepper — Pending, Confirmed,
Seated, Completed — with Cancel and No-show as secondary destructive actions.

Below, an activity timeline: each entry shows who changed what and when, with a hairline
connector down the left.

Footer: a gold "Save changes" button and an outlined "Cancel booking" button.
```

## 12. Menu manager

```
Design the menu management screen.

Left rail: a reorderable list of categories with drag handles, each showing the category
name and its item count, plus an "Add category" button at the bottom.

Main area: the items in the selected category as a reorderable list. Each row has a drag
handle, a small square thumbnail, the dish name with small "Fasting" and "Veg" chips, the
price in gold, a toggle switch for availability, and an actions menu. Show a clear
"Unavailable" treatment — the row dimmed with a small label — because switching a dish off
during service must take one tap.

Sticky header: search, a filter for unavailable items, and a gold "Add dish" button.
```

## 13. Dish editor

```
Design the dish editor screen for a single menu item.

Two columns. Left (wider): a form with English and Arabic name fields shown as two tabs
labelled EN and AR, description fields, price, category select, preparation time, calories,
and an allergen multi-select. Below that, a "Variants" repeater where each row is a size
name and a price difference, with add and remove controls. Below that, a "Per-branch
availability" section — one row per branch with an availability toggle and an optional
price override — collapsed by default behind a "Branch overrides" disclosure.

Right (narrower): an image uploader with a 4:5 preview and drag-to-replace, alt text fields
for both languages, and a card of switches — Featured on home page, Fasting, Vegetarian,
Spicy, Available. When Featured is on, reveal a numeric "Featured rank" field.

Sticky footer bar: "Save" in gold, "Save and add another" outlined, "Delete" as a text
button in a muted destructive style. Show an unsaved-changes indicator.
```

## 14. Page content editor

```
Design the page content editor — this is how the client edits the words on the public site.

Left rail: a list of the eight public pages. Selecting one shows its named sections in the
main area as a vertical list of collapsible blocks — for the home page: Hero, Press strip,
Signature dishes, Story, Breakfast, Occasions, Testimonials, Delivery, FAQ, Closing CTA.

Each expanded block shows only the fields that block owns: eyebrow label, headline,
sub-copy, CTA label and CTA target. Every text field shows a live character counter with
the limit, turning gold as it approaches and red past it. Each field has a small "Reset to
default" link.

Right: a live preview panel showing that section rendered with the current values, updating
as the user types.

Below the blocks, a collapsed "SEO" section with page title, meta description and an OG
image uploader, each with its own character counter and a Google result preview.
```

## 15. Gallery manager

```
Design the gallery management screen.

Header: album tabs (The food, The rooms, Breakfast, Occasions), an "Add album" button, and
a gold "Upload images" button.

Main area: a responsive grid of image thumbnails with drag-to-reorder, each showing a
publish toggle in the corner, and a warning icon when alt text is missing. Selecting images
reveals a bulk action bar — move to album, tag with a branch, publish, unpublish, delete.

Design the upload state: a drag-and-drop zone with per-file progress bars, and after upload
a queue where each image needs alt text before it can be published.
```

## 16. Branches & hours

```
Design the branch management screen.

A list of branches, each expandable into an editor with: name and address in EN/AR tabs,
latitude and longitude with a small map preview, phone, WhatsApp, total seat capacity, and
a display order.

Below that, an opening-hours editor: seven rows, one per weekday, each with an open time,
a close time, and a "Closed" toggle. Show a clear indicator when a closing time crosses
midnight.

Beside it, a "Closure dates" calendar where specific dates can be marked closed with a
reason — holidays and private events.

Include a "Tables" section listing dining tables with label, capacity and zone
(Indoor, Outdoor, Family).
```

## 17. Testimonials & FAQ

```
Design a screen with two tabs: Testimonials and FAQ.

TESTIMONIALS tab: a table of entries with columns — Quote excerpt, Author, Source
(Google, Tripadvisor, Instagram, Restaurant Guru), Rating, Branch, Consent, Published.
Consent is a clear yes/no indicator, and the Publish toggle is disabled with an explanatory
tooltip when consent is not given. The editor is a drawer with a quote textarea, author
name, source select, star rating, branch, a consent checkbox with explanatory text, and a
published toggle.

FAQ tab: a reorderable list of question-and-answer pairs with drag handles, a page
assignment (Home or Reservations), and EN/AR tabs on both fields.
```

## 18. Users, messages and audit

```
Design three related screens.

MESSAGES: an inbox-style two-pane layout — a list of contact messages on the left with
sender, subject, an excerpt and a status dot; the full message on the right with the
sender's details, click-to-call and click-to-WhatsApp, a status control
(New, Read, Replied, Archived) and an internal notes field.

USERS: a table of staff accounts with name, email, role pill (Admin gold, Moderator
outlined), last login and status. An "Invite user" flow as a small modal with email and
role. Show the last-remaining-admin protection as a disabled delete with a tooltip.

AUDIT LOG: a filterable table with columns Time, Actor, Action, Entity and a "View diff"
action that opens a side-by-side before-and-after comparison with changed fields highlighted
in gold. Filters for actor, entity type and date range.
```

---

## Notes for using these

- **Stitch will not match the design pixel-for-pixel.** Treat its output as layout
  exploration and Figma layers to hand the client, not as production code. The tokens in the
  preamble are what keep the variations inside the system.
- **Screens 9–18 are the real value.** The public site already exists in HTML; the dashboard
  does not, and designing it in Stitch before building it in React saves days.
- Feed Stitch **one screen at a time**, and re-paste the preamble when you start a new session.
- Anything Stitch produces still has to pass the constitution — especially Article 16 (tokens),
  Article 28 (contrast, no gold body text) and Article 19 (motion budget).
