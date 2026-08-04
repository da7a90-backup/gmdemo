# Ticket generation — stress test & results

A runnable proof that the mint endpoint is collision-free, idempotent, and never leaves a
paid order without tickets, verified against a real Supabase database under concurrency.

## Interactive test bench: `/tptestaqz00`
Run `pnpm dev` and open **http://localhost:3000/tptestaqz00** for a UI to drive this yourself:
choose the number of orders (1–200, presets included), the entries-per-order range (varying),
a multiplier, and the mode (`seq`/`safe`/`naive`), then hit **Run**. It fires the batch
**server-side** (true concurrency — the browser caps at ~6 connections) and shows the run
summary, per-order results, and the full DB state with **every generated ticket number**
(expand any order). **Reset DB** clears it between runs. Local only (needs `DIRECT_URL`).

## What's here
- `src/lib/server/ticketing.ts` — shared mint logic + batch/reset/audit helpers.
- `src/app/tptestaqz00/page.tsx` + `src/app/api/tptest/{run,reset,audit}` — the test bench.
- `src/app/api/tickets/generate/route.ts` — the endpoint. Query param `?mode=`:
  - **`safe`** (default) — atomic per-order counter (`UPDATE cycle_counters … RETURNING`) +
    `unique(cycle_id, order_token)` + bounded retry.
  - **`seq`** — lock-free per-cycle Postgres `SEQUENCE` (`nextval`). Same guarantees, no
    serialization. **Recommended for production.**
  - **`naive`** — the wrong way (`SELECT MAX()+1`, no lock, no retry). Kept only to demonstrate
    the failure.
- `db/migrations/*.sql` — the tables + constraints (`pnpm migrate` applies them; `pnpm db:setup` resets).
- `scripts/db-setup.mjs` — reset + seed one open cycle (+ its sequence).
- `scripts/ticket-stress-test.mjs` — fires hundreds of concurrent orders and audits the DB.

## How to run
```bash
# .env.local must have DIRECT_URL (Supabase session pooler) with the DB password
pnpm db:setup          # reset + seed cycle 12
pnpm dev               # start the app (separate terminal)
pnpm stress            # scenarios A, B, C

# focused throughput run in a chosen allocator:
ONLY=A MODE=seq N=200 node scripts/ticket-stress-test.mjs
```

## What it checks
- **A — concurrency:** N distinct orders fired simultaneously → every order gets exactly its
  tickets, **no duplicate ticket numbers** (it materializes *every* real ticket number via
  `generate_series` and checks global uniqueness), **no missing**.
- **B — idempotency:** the *same* order delivered K× at once (distinct webhook ids) → exactly
  one set of tickets, never doubled, never zero.
- **C — naive contrast:** the same load in `?mode=naive` → counts orders rejected after
  "payment" (the paid-but-no-ticket failure).

## Measured results (200/50/150 orders, remote Supabase us-east)
| Scenario | Result |
|---|---|
| A — 200 distinct, **safe** | ✅ 0 failed · 0 missing · 0 dup tokens · **3096 tickets, 3096 distinct** |
| A — 200 distinct, **seq** | ✅ 0 failed · 0 missing · 0 dup tokens · **2780 tickets, 2780 distinct** |
| B — same order ×50 | ✅ exactly **1** order · **10** entries (not 500) · 0 errors |
| C — 150 distinct, **naive** | ❌ **135/150 rejected after payment** — `duplicate key … orders_cycle_id_order_token_key` |

**Throughput:** safe (counter row-lock) = **92 s**; seq (lock-free) = **23 s** for 200 orders —
~4× faster, identical correctness. The counter's row lock (held for the whole transaction)
serializes orders; `nextval` does not. Remaining latency is per-transaction network round-trips
to the remote DB — collapsing the mint into a single SQL function would cut it further, but a
weekly raffle needs nowhere near this, and correctness is unaffected either way.

## Conclusion
- The hardened design does **not** duplicate, does **not** lose a paid order's tickets, and is
  idempotent under concurrent + duplicate webhook delivery — proven on the real database.
- The **naive** `SELECT MAX()+1` fails ~90% of the time under the same load — this is the
  production failure to avoid, and the `unique(cycle_id, order_token)` constraint is what turns
  it into a loud rejection (retryable) instead of a silent duplicate.
- **Use `seq` (a per-cycle sequence) in production** — lock-free, collision-proof by design,
  4× faster here — with the unique constraint + retry as the backstop.
