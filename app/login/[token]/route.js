import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { userFromToken } from '@/lib/db';
export async function GET(_, { params }) {
  const { token } = await params;
  if (!(await userFromToken(token))) return new Response('Invalid link', { status: 404 });
  (await cookies()).set('token', token, { httpOnly: true, maxAge: 31536000, path: '/', sameSite: 'lax' });
  redirect('/dashboard');
}
