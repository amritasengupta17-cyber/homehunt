import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function Dash() {
  const u = await getUser(); if (!u) redirect('/');
  const h = await headers();
  const base = process.env.SITE_URL || `https://${h.get('host')}`;
  const list = await sql`select s.id, s.name, s.city, count(l.id)::int n from shortlists s left join listings l on l.shortlist_id=s.id where s.user_id=${u.id} group by s.id order by s.created_at desc`;
  return (<>
    <h1>Your shortlists</h1>
    <div className="box"><h2>Connect to Claude</h2>
      <p className="mute">In Claude: Settings → Connectors → Add custom connector. Paste this link. Keep it private, it is your login.</p>
      <code>{base}/api/mcp/{u.token}</code>
      <p className="mute">Then ask: “Find 5 two-bedroom rentals in Bangalore under 40k near a metro, rank them, and save them to a new shortlist.”</p>
      <p className="mute">Sign back in on another device: <code>{base}/login/{u.token}</code></p></div>
    {list.length === 0 && <p className="mute">No shortlists yet. Ask Claude to create one.</p>}
    {list.map(s => <a key={s.id} href={`/shortlist/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="box"><h2>{s.name}</h2><span className="mute">{s.city || ''} {s.n} listings</span></div></a>)}
  </>);
}
