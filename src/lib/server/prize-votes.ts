// Prize-preference survey ("which car would you want to win?") from the teaser.
// One row per email (latest choice wins).
import { pool } from "./db";

export async function recordPrizeVote(email: string, prize: string, source = "Lander"): Promise<void> {
  const norm = email.trim().toLowerCase();
  const p = String(prize ?? "").trim().slice(0, 120);
  if (!norm || !p) return;
  await pool
    .query(
      `insert into prize_votes (email, prize, source) values ($1, $2, $3)
       on conflict (email) do update set prize = excluded.prize,
         source = coalesce(prize_votes.source, excluded.source), updated_at = now()`,
      [norm, p, source],
    )
    .catch(() => {});
}

/** All survey responses (for an admin view / export). */
export async function listPrizeVotes() {
  return (await pool.query(`select email, prize, source, created_at from prize_votes order by created_at desc`)).rows;
}

/** Tally of votes per prize. */
export async function tallyPrizeVotes(): Promise<{ prize: string; votes: number }[]> {
  return (await pool.query(`select prize, count(*)::int as votes from prize_votes group by prize order by votes desc`)).rows;
}
