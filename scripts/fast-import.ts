import postgres from 'postgres';

const sourceDbUrl = process.env.SOURCE_DATABASE_URL!;
const destDbUrl = process.env.DATABASE_URL!;

async function fastImport() {
  console.log('🔗 Connecting to databases...');
  const source = postgres(sourceDbUrl);
  const dest = postgres(destDbUrl);

  try {
    // Import users
    console.log('\n📥 Importing users...');
    const users = await source`SELECT * FROM public.users`;
    if (users.length > 0) {
      await dest`INSERT INTO users ${dest(users, 'id', 'alien', 'username', 'email', 'password_hash', 'name', 'country', 'profile_image_url', 'is_admin', 'approved', 'invite_code_used', 'created_at', 'updated_at')} ON CONFLICT (id) DO NOTHING`;
      console.log(`✅ Imported ${users.length} users`);
    }

    // Import invite codes
    console.log('\n📥 Importing invite codes...');
    const inviteCodes = await source`SELECT * FROM public.invite_codes`;
    if (inviteCodes.length > 0) {
      await dest`INSERT INTO invite_codes ${dest(inviteCodes, 'id', 'code', 'created_by', 'used_by', 'max_uses', 'current_uses', 'is_active', 'expires_at', 'created_at')} ON CONFLICT (id) DO NOTHING`;
      console.log(`✅ Imported ${inviteCodes.length} invite codes`);
    }

    // Import airlines
    console.log('\n📥 Importing airlines...');
    const airlines = await source`SELECT * FROM public.airlines`;
    if (airlines.length > 0) {
      await dest`INSERT INTO airlines ${dest(airlines, 'id', 'airline_code', 'airline_name', 'country', 'icao', 'iata')} ON CONFLICT (id) DO NOTHING`;
      console.log(`✅ Imported ${airlines.length} airlines`);
    }

    // Import airports in batches
    console.log('\n📥 Importing airports...');
    const airports = await source`SELECT * FROM public.airports`;
    if (airports.length > 0) {
      const batchSize = 1000; // Smaller batches to avoid parameter limit
      for (let i = 0; i < airports.length; i += batchSize) {
        const batch = airports.slice(i, i + batchSize);
        await dest`INSERT INTO airports ${dest(batch, 'id', 'ident', 'type', 'name', 'latitude', 'longitude', 'elevation_ft', 'continent', 'iso_country', 'iso_region', 'municipality', 'gps_code', 'iata', 'icao', 'local_code')} ON CONFLICT (id) DO NOTHING`;
        if ((i + batchSize) % 5000 === 0 || i + batchSize >= airports.length) {
          console.log(`   Processed ${Math.min(i + batchSize, airports.length)}/${airports.length} airports`);
        }
      }
      console.log(`✅ Imported ${airports.length} airports`);
    }

    // Import flights
    console.log('\n📥 Importing flights...');
    const flights = await source`SELECT * FROM public.flights`;
    if (flights.length > 0) {
      await dest`INSERT INTO flights ${dest(flights, 'id', 'user_id', 'airline_name', 'airline_code', 'flight_number', 'departure', 'arrival', 'departure_latitude', 'departure_longitude', 'arrival_latitude', 'arrival_longitude', 'departure_time', 'arrival_time', 'date', 'departure_terminal', 'arrival_terminal', 'aircraft_type', 'distance', 'duration', 'status', 'created_at')} ON CONFLICT (id) DO NOTHING`;
      console.log(`✅ Imported ${flights.length} flights`);
    }

    // Import stay-ins
    console.log('\n📥 Importing stay-ins...');
    const stayins = await source`SELECT * FROM public.stayins`;
    if (stayins.length > 0) {
      await dest`INSERT INTO stayins ${dest(stayins, 'id', 'user_id', 'check_in', 'check_out', 'country', 'city', 'name', 'maps_pin', 'type', 'created_at')} ON CONFLICT (id) DO NOTHING`;
      console.log(`✅ Imported ${stayins.length} stay-ins`);
    }

    console.log('\n🎉 Data import completed successfully!');
    
    // Show summary
    console.log('\n📊 Final Counts in Replit Database:');
    const counts = await dest`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM flights) as flights,
        (SELECT COUNT(*) FROM stayins) as stayins,
        (SELECT COUNT(*) FROM airlines) as airlines,
        (SELECT COUNT(*) FROM airports) as airports,
        (SELECT COUNT(*) FROM invite_codes) as invite_codes
    `;
    
    console.log(`   Users: ${counts[0].users}`);
    console.log(`   Flights: ${counts[0].flights}`);
    console.log(`   Stay-ins: ${counts[0].stayins}`);
    console.log(`   Airlines: ${counts[0].airlines}`);
    console.log(`   Airports: ${counts[0].airports}`);
    console.log(`   Invite Codes: ${counts[0].invite_codes}`);

  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  } finally {
    await source.end();
    await dest.end();
  }
}

fastImport();
