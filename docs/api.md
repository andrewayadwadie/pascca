# PASCca API — Error Code Registry

**Article 10 [NN]**: every response is enveloped. Clients switch on `code`, never on `message`.
Codes are permanent once shipped — a thrown error without a registered code here is a bug.

## Response envelope

```jsonc
// success
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 42 } }

// failure
{ "success": false, "error": { "code": "RES_SLOT_UNAVAILABLE", "message": "…", "details": [] } }
```

## Registered codes

_Empty — no API endpoint has shipped yet. This table is seeded now (`001-monorepo-scaffold`) so
the first feature that throws a real error has a registry to register in, per Article 10._

| Code | HTTP Status | Meaning | Introduced by |
|---|---|---|---|
| _(none yet)_ | | | |

## Adding a code

1. Pick a permanent, stable `SCREAMING_SNAKE_CASE` name. It ships once and cannot be renamed.
2. Add a row to the table above in the same PR that throws it.
3. Never reuse a retired code for a different meaning.
