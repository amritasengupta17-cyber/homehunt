import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql, userFromToken } from '@/lib/db';
import { randomBytes } from 'crypto';
export const dynamic = 'force-dynamic';

async function start() {
  'use server';
  const t = randomBytes(24).toString('hex');
  await sql`insert into users(token) values(${t})`;
  (await cookies()).set('token', t, { httpOnly: true, maxAge: 31536000, path: '/', sameSite: 'lax' });
  redirect('/dashboard');
}
export default async function Home() {
  if (await userFromToken((await cookies()).get('token')?.value)) redirect('/dashboard');
  return (<>
    <h1>Claude finds the homes. HomeHunt keeps the shortlist.</h1>
    <p>Ask Claude to search and rank rentals or homes. They land here as cards you can edit, share with your partner or agent, vote on, and track from first viewing to offer.</p>
    <form action={start}><button className="btn">Create my shortlist space</button></form>
    <p className="mute">No signup. You get a private MCP link to connect to Claude.</p>
  </>);
}
