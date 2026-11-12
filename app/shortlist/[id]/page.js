import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { sql, loadListings } from '@/lib/db';
import { getUser } from '@/lib/auth';
import Cards from '@/components/Cards';
export const dynamic = 'force-dynamic';
export default async function Page({ params }) {
  const u = await getUser(); if (!u) redirect('/');
  const { id } = await params;
  const [s] = await sql`select * from shortlists where id=${id} and user_id=${u.id}`; if (!s) notFound();
  const listings = await loadListings(s.id);
  const h = await headers(); const base = process.env.SITE_URL || `https://${h.get('host')}`;
  return (<>
    <a href="/dashboard">← All shortlists</a>
    <h1>{s.name}</h1>
    <p className="mute">{[s.city, s.budget, s.requirements].filter(Boolean).join(' · ')}</p>
    <div className="box row"><span>Share with your partner or agent:</span><code>{base}/s/{s.share_id}</code></div>
    <Cards initial={listings} />
  </>);
}
