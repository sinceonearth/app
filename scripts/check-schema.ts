import postgres from 'postgres';

const sourceDbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!sourceDbUrl) {
  throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
}

async function checkSchema() {
  const client = postgres(sourceDbUrl);
  
  try {
    console.log('🔍 Checking all schemas and tables...');
    const tables = await client`
      SELECT 
        table_schema, 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `;
    
    console.log(`\nFound ${tables.length} tables across all schemas:`);
    tables.forEach((table: any) => {
      console.log(`  ${table.table_schema}.${table.table_name} (${table.table_type})`);
    });
    
    // Try to count rows in the first few tables
    console.log('\n📊 Attempting to count rows in first few tables:');
    for (const table of tables.slice(0, 10)) {
      const schemaName = table.table_schema;
      const tableName = table.table_name;
      try {
        const count = await client.unsafe(`SELECT COUNT(*) as count FROM "${schemaName}"."${tableName}"`);
        if (count[0].count > 0) {
          console.log(`  ✅ ${schemaName}.${tableName}: ${count[0].count} rows`);
        }
      } catch (error: any) {
        console.log(`  ⚠️  ${schemaName}.${tableName}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkSchema();
