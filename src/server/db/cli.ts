import { closeDatabase, getDatabase } from './client';
import { migrateDatabase } from './migrate';
import { seedDevelopmentDatabase } from './seed';
import { AuthService } from '../auth/session';

const command = process.argv[2];
const database = getDatabase();

async function createAdmin() {
  await migrateDatabase(database);
  const email = process.argv[3] || process.env.SEED_ADMIN_EMAIL;
  const password = process.argv[4] || process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Provide credentials: npm run admin:create <email> <password> (or set SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD)',
    );
  }
  const existing = (await database.prepare('SELECT COUNT(*) AS count FROM admin_users').get()) as {
    count: number;
  };
  if (existing.count > 0) {
    console.log('An admin account already exists — nothing to do.');
    return;
  }
  await new AuthService(database).createAdmin({ email, password, role: 'owner' });
  console.log(`Owner admin created: ${email}`);
}

async function main() {
  try {
    if (command === 'migrate') {
      await migrateDatabase(database);
      console.log('Database migrations are up to date.');
    } else if (command === 'seed') {
      await migrateDatabase(database);
      await seedDevelopmentDatabase(database);
      console.log('Development catalog seed is up to date.');
    } else if (command === 'admin:create') {
      // Works in production, unlike the dev-only auto-seed of the first admin.
      await createAdmin();
    } else {
      throw new Error('Usage: npm run db:migrate | npm run db:seed | npm run admin:create <email> <password>');
    }
  } finally {
    await closeDatabase();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
