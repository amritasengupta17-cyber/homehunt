import { sql } from '@/lib/db';
export async function POST(req) {
  const { share, listing_id, name, vote, comment } = await req.json();
  const n = String(name || '').trim().slice(0, 40); if (!n) return new Response('Name required', { status: 400 });
  const [ok] = await sql`select l.id from listings l join shortlists s on s.id=l.shortlist_id where l.id=${listing_id} and s.share_id=${share}`;
  if (!ok) return new Response('Not found', { status: 404 });
  const c = comment ? String(comment).slice(0, 500) : null;
  if (vote && !c) await sql`delete from feedback where listing_id=${listing_id} and name=${n} and comment is null`; // one vote per name
  await sql`insert into feedback(listing_id,name,vote,comment) values(${listing_id},${n},${Number(vote) || 0},${c})`;
  return new Response(null, { status: 204 });
}
