import postgres from 'postgres';

const sourceDbUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;

async function countData() {
  const client = postgres(sourceDbUrl);
  
  try {
    const tables = ['users', 'flights', 'stayins', 'airlines', 'airports', 'invite_codes'];
    
    console.log('📊 Counting rows in each table:\n');
    
    for (const tableName of tables) {
      try {
        const count = await client.unsafe(`SELECT COUNT(*) as count FROM public."${tableName}"`);
        console.log(`✅ ${tableName}: ${count[0].count} rows`);
        
        // Show sample if data exists
        if (count[0].count > 0 && count[0].count <= 3) {
          const sample = await client.unsafe(`SELECT * FROM public."${tableName}" LIMIT 2`);
          console.log(`   Sample:`, JSON.stringify(sample[0], null, 2));
        } else if (count[0].count > 0) {
          const sample = await client.unsafe(`SELECT * FROM public."${tableName}" LIMIT 1`);
          console.log(`   First row keys:`, Object.keys(sample[0]).join(', '));
        }
      } catch (error: any) {
        console.log(`❌ ${tableName}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

countData();
