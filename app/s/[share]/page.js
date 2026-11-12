import { notFound } from 'next/navigation';
import { sql, loadListings } from '@/lib/db';
import Guest from '@/components/Guest';
export const dynamic = 'force-dynamic';
export default async function Shared({ params }) {
  const { share } = await params;
  const [s] = await sql`select id, name, city, budget, requirements from shortlists where share_id=${share}`; if (!s) notFound();
  const listings = await loadListings(s.id);
  return (<>
    <h1>{s.name}</h1>
    <p className="mute">{[s.city, s.budget, s.requirements].filter(Boolean).join(' · ')}</p>
    <Guest share={share} initial={listings} />
  </>);
}
