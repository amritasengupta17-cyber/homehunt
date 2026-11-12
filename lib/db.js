import postgres from 'postgres';
// Pooler URL + prepare:false = fast, safe on serverless. Cached across warm invocations.
export const sql = globalThis._sql ||= postgres(process.env.DATABASE_URL, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });

export async function userFromToken(t) {
  if (!t) return null;
  const [u] = await sql`select id, token from users where token=${t}`;
  return u || null;
}
export async function loadListings(shortlistId) {
  const [listings, fb] = await Promise.all([
    sql`select * from listings where shortlist_id=${shortlistId} order by score desc, position`,
    sql`select f.listing_id, f.name, f.vote, f.comment from feedback f join listings l on l.id=f.listing_id where l.shortlist_id=${shortlistId} order by f.created_at`,
  ]);
  const by = {};
  for (const f of fb) (by[f.listing_id] ||= []).push(f);
  return listings.map(l => ({ ...l, feedback: by[l.id] || [] }));
}
