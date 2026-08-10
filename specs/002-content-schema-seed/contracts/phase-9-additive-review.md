# Contract: Phase 9 Additive-Design Review

**Feature**: `002-content-schema-seed` · **Article**: 11 (Phase discipline)
**Satisfies**: FR-008, SC-005

Article 11 says the forward-compatibility obligation is *"satisfied by design review, not by
writing code early."* This is that review. It is a contract in the sense that matters: a later
feature that violates it breaks a promise made here.

**Nothing in this document may be implemented now.** No `Order`, `OrderItem`, `Payment`, or
`LoyaltyAccount` table is created by feature 002 — not as a stub, not commented out, not behind a
flag (Article 1 [NN], FR-008).

---

## The claim

> Phase 9 ordering can be added to this schema with **zero `ALTER TABLE` and zero `DROP`** on any
> table feature 002 creates.

## Why it holds: FK direction

A foreign key is a column on the **referencing** side. `OrderItem.menuItemId` lives on
`OrderItem`. `MenuItem` needs no column to be referenced — not even to expose the reverse
relation, because Prisma's `orders OrderItem[]` back-relation is a *client-side* convenience that
generates no SQL column and no migration DDL.

That single fact is what makes the whole thing work. Every Phase 9 attachment point points
*inward* at 002's tables and carries its own FK.

## The sketch

```prisma
// PHASE 9 ONLY — DO NOT CREATE IN FEATURE 002
model Order {
  id          String       @id @default(cuid())
  code        String       @unique
  branchId    String                            // → Branch  (FK on Order)
  customerId  String?                           // → User    (FK on Order)
  status      OrderStatus
  subtotal    Int                               // piastres — same unit as MenuItem.price
  deliveryFee Int          @default(0)
  total       Int
  placedAt    DateTime     @default(now())
  items       OrderItem[]
}

model OrderItem {
  id         String  @id @default(cuid())
  orderId    String                             // → Order
  menuItemId String                             // → MenuItem       (FK on OrderItem)
  variantId  String?                            // → MenuItemVariant (FK on OrderItem)
  quantity   Int
  unitPrice  Int                                // price AS CHARGED — see the trap below
  lineTotal  Int
}

model Payment       { id String @id; orderId String;  /* → Order */  ... }
model LoyaltyAccount{ id String @id; userId  String @unique; /* → User */ ... }
```

## Attachment-point audit

| Phase 9 needs | Attaches via | Touches a 002 table? |
|---|---|---|
| Order → Branch | `Order.branchId` | No — FK on `Order` |
| Order → customer | `Order.customerId` → `User` | No — FK on `Order`. `Role.CUSTOMER` already exists. |
| OrderItem → MenuItem | `OrderItem.menuItemId` | No — FK on `OrderItem` |
| OrderItem → variant | `OrderItem.variantId` → `MenuItemVariant` | No — FK on `OrderItem` |
| Per-branch price at order time | reads `MenuItemBranch.price`, copies to `OrderItem.unitPrice` | No — read-only |
| Payment → Order | `Payment.orderId` | No — both are Phase 9 tables |
| Loyalty → User | `LoyaltyAccount.userId` | No — FK on `LoyaltyAccount` |
| Order audit trail | writes `AuditLog` rows | No — `AuditLog.entity`/`entityId` are already generic `String` |
| Delivery-partner cutover | flips `SiteSetting` keys | No — `value` is already `Json` |

Nine attachment points, zero alterations.

## Two design choices in 002 that were made *for* this

Both are load-bearing; neither is accidental.

1. **`AuditLog.entity` / `entityId` are plain `String`, not an enum and not a typed FK.** An enum
   would need `ALTER TYPE ... ADD VALUE 'Order'` — technically a type change rather than a table
   change, but a schema migration touching a 002 object all the same, and a typed FK would be far
   worse (a separate nullable column per entity type). Generic strings mean Phase 9's audit rows
   need no DDL at all.

2. **`SiteSetting.value` is `Json`, not `String`.** Article 23 says the delivery links get swapped
   or removed the day own-ordering launches. A `Json` value absorbs a shape change
   (`"https://..."` → `{ enabled: false, replacedBy: "own-ordering" }`) with no migration.

## The trap, named before anyone falls in it

`OrderItem.unitPrice` **must** be its own column, storing the price as charged at the moment the
order was placed.

The tempting alternative — join to `MenuItem.price` at read time — is wrong twice over. It gives
the wrong answer the first time a price changes (last month's receipt silently reprices itself),
and the "fix" someone reaches for is to make `MenuItem.price` historical: versioned rows,
`effectiveFrom`/`effectiveTo` columns. **That would alter a 002 table and break this review's
guarantee.**

An order's price is a fact about the order, not a lookup against the menu. Copy it at write time.

## Boundary this review does not cross

Reservations are *not* orders. Article 1 [NN] keeps ordering, payments, loyalty, and delivery
tracking in Phase 9. `Reservation` gains no `orderId`, and `Order` gains no `reservationId` — if a
future feature wants to link a walk-in order to a booking, that is a **new join table**
(`OrderReservation`), which is once again purely additive.

## How to verify this review still holds

When Phase 9 is actually built, its migration SQL must contain only `CREATE TABLE`,
`CREATE INDEX`, and `ALTER TABLE <phase-9-table> ADD CONSTRAINT ... FOREIGN KEY`. Any
`ALTER TABLE` naming a table in this list is a violation of the promise made here:

`User` · `RefreshToken` · `Branch` · `BranchHour` · `BranchClosure` · `DiningTable` · `Category` ·
`MenuItem` · `MenuItemVariant` · `MenuItemBranch` · `Reservation` · `ReservationEvent` ·
`GalleryAlbum` · `GalleryImage` · `Testimonial` · `FaqItem` · `TeamMember` · `Milestone` · `Post` ·
`PageBlock` · `PageSeo` · `ContactMessage` · `SiteSetting` · `AuditLog`
