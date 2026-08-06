import { getDatabase } from './client';
import { migrateDatabase } from './migrate';
import { seedDevelopmentDatabase } from './seed';

let ready = false;

export async function getCommerceDatabase() {
  const database = getDatabase();
  if (!ready) {
    await migrateDatabase(database);
    if (process.env.NODE_ENV !== 'production') await seedDevelopmentDatabase(database);
    ready = true;
  }
  return database;
}
