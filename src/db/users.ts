import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name: string, avatar: string) {
  const result = await db.insert(users)
    .values({ uid, email, name, avatar })
    .onConflictDoUpdate({
      target: users.uid,
      set: { email, name, avatar },
    })
    .returning();
  return result[0];
}

export async function getUserByUid(uid: string) {
  const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  return result[0] || null;
}
