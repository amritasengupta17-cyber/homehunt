import { cookies } from 'next/headers';
import { userFromToken } from './db';
export async function getUser() { return userFromToken((await cookies()).get('token')?.value); }
