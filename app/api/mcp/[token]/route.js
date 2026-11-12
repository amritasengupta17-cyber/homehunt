import { sql, userFromToken, loadListings } from '@/lib/db';
export const dynamic = 'force-dynamic';

const L = { type: 'object', properties: {
  address: { type: 'string' }, price: { type: 'string', description: 'e.g. "₹38,000/mo" or "$450,000"' },
  beds: { type: 'string' }, baths: { type: 'string' }, area: { type: 'string', description: 'size, e.g. "950 sqft"' },
  source_url: { type: 'string', description: 'link to the original listing' }, photo_url: { type: 'string' },
  pros: { type: 'array', items: { type: 'string' } }, cons: { type: 'array', items: { type: 'string' } },
  score: { type: 'integer', description: '0-100 fit with the requirements' } }, required: ['address'] };
const TOOLS = [
  { name: 'create_shortlist', description: 'Create a new home-hunt shortlist. Returns its id plus owner and share links. Send structured fields only.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, city: { type: 'string' }, budget: { type: 'string' }, requirements: { type: 'string' } }, required: ['name'] } },
  { name: 'add_listings', description: 'Add listings you found and ranked to a shortlist. Send structured fields (not paragraphs); pros/cons as short bullet strings; score 0-100.',
    inputSchema: { type: 'object', properties: { shortlist_id: { type: 'string' }, listings: { type: 'array', items: L } }, required: ['shortlist_id', 'listings'] } },
  { name: 'list_shortlists', description: "List the user's shortlists, so you can add to an existing one.", inputSchema: { type: 'object', properties: {} } },
  { name: 'get_shortlist', description: 'Get a shortlist with all listings, status, notes, and votes/comments from people it was shared with.',
    inputSchema: { type: 'object', properties: { shortlist_id: { type: 'string' } }, required: ['shortlist_id'] } },
  { name: 'update_listing', description: 'Edit a listing field or change its status (New, Viewing booked, Visited, Offer made, Rejected).',
    inputSchema: { type: 'object', properties: { listing_id: { type: 'string' }, address: { type: 'string' }, price: { type: 'string' }, beds: { type: 'string' }, baths: { type: 'string' }, area: { type: 'string' }, status: { type: 'string' }, notes: { type: 'string' }, score: { type: 'integer' }, pros: { type: 'array', items: { type: 'string' } }, cons: { type: 'array', items: { type: 'string' } } }, required: ['listing_id'] } },
];
const j = a => (Array.isArray(a) ? a.join('\n') : a ?? '');
const own = (uid, id) => sql`select id, share_id, name from shortlists where id=${id} and user_id=${uid}`.then(r => r[0]);

async function run(name, a, uid, base) {
  if (name === 'create_shortlist') {
    const [s] = await sql`insert into shortlists(user_id,name,city,budget,requirements) values(${uid},${a.name},${a.city ?? null},${a.budget ?? null},${a.requirements ?? null}) returning id, share_id`;
    return { shortlist_id: s.id, owner_link: `${base}/shortlist/${s.id}`, share_link: `${base}/s/${s.share_id}` };
  }
  if (name === 'list_shortlists')
    return sql`select s.id, s.name, s.city, count(l.id)::int as listings from shortlists s left join listings l on l.shortlist_id=s.id where s.user_id=${uid} group by s.id order by s.created_at desc`;
  const s = a.shortlist_id && await own(uid, a.shortlist_id);
  if (name === 'add_listings') {
    if (!s) throw new Error('Shortlist not found');
    const [{ m }] = await sql`select coalesce(max(position),0) m from listings where shortlist_id=${s.id}`;
    const rows = a.listings.map((x, i) => ({ shortlist_id: s.id, address: x.address, price: x.price ?? null, beds: x.beds ?? null, baths: x.baths ?? null, area: x.area ?? null, source_url: x.source_url ?? null, photo_url: x.photo_url ?? null, pros: j(x.pros), cons: j(x.cons), score: x.score ?? 0, position: m + i + 1 }));
    await sql`insert into listings ${sql(rows)}`; // one batched insert
    return { added: rows.length, owner_link: `${base}/shortlist/${s.id}`, share_link: `${base}/s/${s.share_id}` };
  }
  if (name === 'get_shortlist') { if (!s) throw new Error('Shortlist not found'); return { ...s, listings: await loadListings(s.id) }; }
  if (name === 'update_listing') {
    const { listing_id, ...f } = a; const p = {};
    for (const k of ['address', 'price', 'beds', 'baths', 'area', 'status', 'notes', 'score']) if (f[k] !== undefined) p[k] = f[k];
    for (const k of ['pros', 'cons']) if (f[k] !== undefined) p[k] = j(f[k]);
    if (!Object.keys(p).length) throw new Error('Nothing to update');
    const r = await sql`update listings set ${sql(p)} where id=${listing_id} and shortlist_id in (select id from shortlists where user_id=${uid}) returning id`;
    if (!r.length) throw new Error('Listing not found');
    return { updated: listing_id };
  }
  throw new Error('Unknown tool');
}

const reply = (id, result, error) => Response.json({ jsonrpc: '2.0', id, ...(error ? { error } : { result }) });

export async function POST(req, { params }) {
  const { token } = await params;
  const msg = await req.json();
  if (msg.id === undefined) return new Response(null, { status: 202 }); // notifications
  if (msg.method === 'initialize')
    return reply(msg.id, { protocolVersion: msg.params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'homehunt', version: '1.0.0' } });
  if (msg.method === 'ping') return reply(msg.id, {});
  if (msg.method === 'tools/list') return reply(msg.id, { tools: TOOLS });
  if (msg.method === 'tools/call') {
    const u = await userFromToken(token);
    if (!u) return reply(msg.id, { content: [{ type: 'text', text: 'Invalid MCP link' }], isError: true });
    const base = process.env.SITE_URL || new URL(req.url).origin;
    try {
      const out = await run(msg.params.name, msg.params.arguments || {}, u.id, base);
      return reply(msg.id, { content: [{ type: 'text', text: JSON.stringify(out) }] });
    } catch (e) { return reply(msg.id, { content: [{ type: 'text', text: e.message }], isError: true }); }
  }
  return reply(msg.id, null, { code: -32601, message: 'Method not found' });
}
export const GET = () => new Response('Method not allowed', { status: 405 });
