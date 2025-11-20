import postgres from 'postgres';

const sourceDbUrl = process.env.SOURCE_DATABASE_URL!;
const destDbUrl = process.env.DATABASE_URL!;

async function importData() {
  console.log('🔗 Connecting to databases...');
  const source = postgres(sourceDbUrl);
  const dest = postgres(destDbUrl);

  try {
    // Import users
    console.log('\n📥 Importing users...');
    const users = await source`SELECT * FROM public.users`;
    if (users.length > 0) {
      for (const user of users) {
        await dest`
          INSERT INTO users (id, alien, username, email, password_hash, name, country, profile_image_url, is_admin, approved, invite_code_used, created_at, updated_at)
          VALUES (${user.id}, ${user.alien}, ${user.username}, ${user.email}, ${user.password_hash}, ${user.name}, ${user.country}, ${user.profile_image_url}, ${user.is_admin}, ${user.approved}, ${user.invite_code_used}, ${user.created_at}, ${user.updated_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ Imported ${users.length} users`);
    }

    // Import invite codes
    console.log('\n📥 Importing invite codes...');
    const inviteCodes = await source`SELECT * FROM public.invite_codes`;
    if (inviteCodes.length > 0) {
      for (const code of inviteCodes) {
        await dest`
          INSERT INTO invite_codes (id, code, created_by, used_by, max_uses, current_uses, is_active, expires_at, created_at)
          VALUES (${code.id}, ${code.code}, ${code.created_by}, ${code.used_by}, ${code.max_uses}, ${code.current_uses}, ${code.is_active}, ${code.expires_at}, ${code.created_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ Imported ${inviteCodes.length} invite codes`);
    }

    // Import airlines
    console.log('\n📥 Importing airlines...');
    const airlines = await source`SELECT * FROM public.airlines`;
    if (airlines.length > 0) {
      for (const airline of airlines) {
        await dest`
          INSERT INTO airlines (id, airline_code, airline_name, country, icao, iata)
          VALUES (${airline.id}, ${airline.airline_code}, ${airline.airline_name}, ${airline.country}, ${airline.icao}, ${airline.iata})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ Imported ${airlines.length} airlines`);
    }

    // Import airports
    console.log('\n📥 Importing airports (this may take a while...)...');
    const airports = await source`SELECT * FROM public.airports`;
    if (airports.length > 0) {
      // Batch insert airports for efficiency
      console.log(`   Processing ${airports.length} airports in batches...`);
      const batchSize = 1000;
      for (let i = 0; i < airports.length; i += batchSize) {
        const batch = airports.slice(i, i + batchSize);
        for (const airport of batch) {
          await dest`
            INSERT INTO airports (id, ident, type, name, latitude, longitude, elevation_ft, continent, iso_country, iso_region, municipality, gps_code, iata, icao, local_code)
            VALUES (${airport.id}, ${airport.ident}, ${airport.type}, ${airport.name}, ${airport.latitude}, ${airport.longitude}, ${airport.elevation_ft}, ${airport.continent}, ${airport.iso_country}, ${airport.iso_region}, ${airport.municipality}, ${airport.gps_code}, ${airport.iata}, ${airport.icao}, ${airport.local_code})
            ON CONFLICT (id) DO NOTHING
          `;
        }
        console.log(`   Processed ${Math.min(i + batchSize, airports.length)}/${airports.length} airports`);
      }
      console.log(`✅ Imported ${airports.length} airports`);
    }

    // Import flights
    console.log('\n📥 Importing flights...');
    const flights = await source`SELECT * FROM public.flights`;
    if (flights.length > 0) {
      for (const flight of flights) {
        await dest`
          INSERT INTO flights (id, user_id, airline_name, airline_code, flight_number, departure, arrival, departure_latitude, departure_longitude, arrival_latitude, arrival_longitude, departure_time, arrival_time, date, departure_terminal, arrival_terminal, aircraft_type, distance, duration, status, created_at)
          VALUES (${flight.id}, ${flight.user_id}, ${flight.airline_name}, ${flight.airline_code}, ${flight.flight_number}, ${flight.departure}, ${flight.arrival}, ${flight.departure_latitude}, ${flight.departure_longitude}, ${flight.arrival_latitude}, ${flight.arrival_longitude}, ${flight.departure_time}, ${flight.arrival_time}, ${flight.date}, ${flight.departure_terminal}, ${flight.arrival_terminal}, ${flight.aircraft_type}, ${flight.distance}, ${flight.duration}, ${flight.status}, ${flight.created_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ Imported ${flights.length} flights`);
    }

    // Import stay-ins
    console.log('\n📥 Importing stay-ins...');
    const stayins = await source`SELECT * FROM public.stayins`;
    if (stayins.length > 0) {
      for (const stayin of stayins) {
        await dest`
          INSERT INTO stayins (id, user_id, check_in, check_out, country, city, name, maps_pin, type, created_at)
          VALUES (${stayin.id}, ${stayin.user_id}, ${stayin.check_in}, ${stayin.check_out}, ${stayin.country}, ${stayin.city}, ${stayin.name}, ${stayin.maps_pin}, ${stayin.type}, ${stayin.created_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log(`✅ Imported ${stayins.length} stay-ins`);
    }

    console.log('\n🎉 Data import completed successfully!');
    
    // Show summary
    console.log('\n📊 Import Summary:');
    const userCount = await dest`SELECT COUNT(*) as count FROM users`;
    const flightCount = await dest`SELECT COUNT(*) as count FROM flights`;
    const stayinCount = await dest`SELECT COUNT(*) as count FROM stayins`;
    const airlineCount = await dest`SELECT COUNT(*) as count FROM airlines`;
    const airportCount = await dest`SELECT COUNT(*) as count FROM airports`;
    
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Flights: ${flightCount[0].count}`);
    console.log(`   Stay-ins: ${stayinCount[0].count}`);
    console.log(`   Airlines: ${airlineCount[0].count}`);
    console.log(`   Airports: ${airportCount[0].count}`);

  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  } finally {
    await source.end();
    await dest.end();
  }
}

importData();
