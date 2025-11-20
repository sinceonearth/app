import postgres from 'postgres';

const sourceDbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!sourceDbUrl) {
  throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
}

async function checkTables() {
  const client = postgres(sourceDbUrl);
  
  try {
    console.log('🔍 Checking tables in external Neon database...');
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`\nFound ${tables.length} tables:`);
    tables.forEach((table: any) => console.log(`  - ${table.table_name}`));
    
    // Check row counts for each table
    for (const table of tables) {
      const tableName = table.table_name;
      try {
        const count = await client.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`\n${tableName}: ${count[0].count} rows`);
        
        // Show sample data if rows exist
        if (count[0].count > 0 && count[0].count <= 5) {
          const sample = await client.unsafe(`SELECT * FROM ${tableName} LIMIT 3`);
          console.log(`  Sample data:`, JSON.stringify(sample, null, 2));
        }
      } catch (error) {
        console.log(`  Error counting ${tableName}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkTables();
