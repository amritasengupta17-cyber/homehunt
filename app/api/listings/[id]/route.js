import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
const OK = ['address', 'price', 'beds', 'baths', 'area', 'status', 'notes', 'pros', 'cons', 'score', 'source_url'];
export async function PATCH(req, { params }) {
  const u = await getUser(); if (!u) return new Response('Unauthorized', { status: 401 });
  const { id } = await params; const b = await req.json(); const p = {};
  for (const k of OK) if (b[k] !== undefined) p[k] = b[k];
  if (!Object.keys(p).length) return new Response(null, { status: 204 });
  await sql`update listings set ${sql(p)} where id=${id} and shortlist_id in (select id from shortlists where user_id=${u.id})`;
  return new Response(null, { status: 204 });
}
export async function DELETE(_, { params }) {
  const u = await getUser(); if (!u) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  await sql`delete from listings where id=${id} and shortlist_id in (select id from shortlists where user_id=${u.id})`;
  return new Response(null, { status: 204 });
}
