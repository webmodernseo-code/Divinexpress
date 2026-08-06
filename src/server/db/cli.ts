import { closeDatabase, getDatabase } from './client';
import { migrateDatabase } from './migrate';
import { seedDevelopmentDatabase } from './seed';

const command = process.argv[2];
const database = getDatabase();

async function main() {
  try {
    if (command === 'migrate') {
      await migrateDatabase(database);
      console.log('Database migrations are up to date.');
    } else if (command === 'seed') {
      await migrateDatabase(database);
      await seedDevelopmentDatabase(database);
      console.log('Development catalog seed is up to date.');
    } else {
      throw new Error('Usage: npm run db:migrate | npm run db:seed');
    }
  } finally {
    await closeDatabase();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
