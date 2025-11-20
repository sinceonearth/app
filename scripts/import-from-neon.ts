import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// External Neon database (source) - from environment
const sourceDbUrl = process.env.SOURCE_DATABASE_URL!;

// Replit database (destination) - from environment
const destDbUrl = process.env.DATABASE_URL!;

async function importData() {
  console.log('🔗 Connecting to source Neon database...');
  const sourceClient = postgres(sourceDbUrl);
  const sourceDb = drizzle(sourceClient, { schema });

  console.log('🔗 Connecting to destination Replit database...');
  const destClient = postgres(destDbUrl);
  const destDb = drizzle(destClient, { schema });

  try {
    // Import users
    console.log('📥 Importing users...');
    const users = await sourceDb.select().from(schema.users);
    if (users.length > 0) {
      await destDb.insert(schema.users).values(users).onConflictDoNothing();
      console.log(`✅ Imported ${users.length} users`);
    }

    // Import invite codes
    console.log('📥 Importing invite codes...');
    const inviteCodes = await sourceDb.select().from(schema.inviteCodes);
    if (inviteCodes.length > 0) {
      await destDb.insert(schema.inviteCodes).values(inviteCodes).onConflictDoNothing();
      console.log(`✅ Imported ${inviteCodes.length} invite codes`);
    }

    // Import airlines
    console.log('📥 Importing airlines...');
    const airlines = await sourceDb.select().from(schema.airlines);
    if (airlines.length > 0) {
      await destDb.insert(schema.airlines).values(airlines).onConflictDoNothing();
      console.log(`✅ Imported ${airlines.length} airlines`);
    }

    // Import airports
    console.log('📥 Importing airports...');
    const airports = await sourceDb.select().from(schema.airports);
    if (airports.length > 0) {
      await destDb.insert(schema.airports).values(airports).onConflictDoNothing();
      console.log(`✅ Imported ${airports.length} airports`);
    }

    // Import flights
    console.log('📥 Importing flights...');
    const flights = await sourceDb.select().from(schema.flights);
    if (flights.length > 0) {
      await destDb.insert(schema.flights).values(flights).onConflictDoNothing();
      console.log(`✅ Imported ${flights.length} flights`);
    }

    // Import stay-ins
    console.log('📥 Importing stay-ins...');
    const stayins = await sourceDb.select().from(schema.stayins);
    if (stayins.length > 0) {
      await destDb.insert(schema.stayins).values(stayins).onConflictDoNothing();
      console.log(`✅ Imported ${stayins.length} stay-ins`);
    }

    console.log('🎉 Data import completed successfully!');
  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  } finally {
    await sourceClient.end();
    await destClient.end();
  }
}

importData().catch(console.error);
