import { Pool } from "pg";

const NEON_DB_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!NEON_DB_URL) {
  throw new Error("NEON_DATABASE_URL or DATABASE_URL is not defined");
}

const DIRECT_URL = NEON_DB_URL.replace('-pooler', '');
console.log('🔗 Using database connection:', DIRECT_URL.replace(/:[^@]*@/, ':***@'));

export const pool = new Pool({
  connectionString: DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});

// Run schema updates on startup
(async () => {
  try {
    await pool.query('DISCARD ALL');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_icon VARCHAR,
      ADD COLUMN IF NOT EXISTS profile_color VARCHAR,
      ADD COLUMN IF NOT EXISTS profile_setup_complete BOOLEAN DEFAULT FALSE NOT NULL
    `);
    console.log("✅ Database schema updated: profile columns added");
  } catch (err) {
    console.error("❌ Schema update error:", err);
  }
})();

export interface UserInput {
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  country?: string | null;
  alien?: string;
  approved?: boolean;
  inviteCodeUsed?: string | null;
}

export interface FlightInput {
  userId: string;
  airlineName: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureLatitude?: number | null;
  departureLongitude?: number | null;
  arrivalLatitude?: number | null;
  arrivalLongitude?: number | null;
  date: string;
  departureTime?: string | null;
  arrivalTime?: string | null;
  aircraftType?: string | null;
  distance?: number;
  duration?: string | null;
  status?: string;

  departure_terminal?: string | null;
  arrival_terminal?: string | null;
}

export const storage = {
  /* ===============================
     👤 Users
     =============================== */
  async getUserByUsernameOrEmail(identifier: string) {
    const result = await pool.query(
      `SELECT * FROM users WHERE username = $1 OR email = $1`,
      [identifier],
    );
    return result.rows[0];
  },

  async getUser(id: string) {
    const result = await pool.query(
      `SELECT id, username, email, name, country, alien, is_admin AS "isAdmin", created_at AS "createdAt"
       FROM users
       WHERE id = $1`,
      [id],
    );
    return result.rows[0];
  },

  async getUserById(id: string) {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return result.rows[0];
  },

  async getAllUsers() {
    const result = await pool.query(`SELECT * FROM users ORDER BY id ASC`);
    return result.rows;
  },

  async createUser({
    username,
    email,
    passwordHash,
    name,
    country,
    approved,
    inviteCodeUsed,
  }: UserInput) {
    // Use a transaction to safely assign next alien
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get max current alien value
      const res = await client.query(
        `SELECT MAX(alien) AS maxAlien FROM users`,
      );
      const maxAlien = res.rows[0]?.maxalien || "00";
      let nextAlienNumber = parseInt(maxAlien, 10) + 1;

      // Limit to 99
      if (nextAlienNumber > 99)
        throw new Error("Maximum number of users reached");

      const alienStr = String(nextAlienNumber).padStart(2, "0");

      const insertRes = await client.query(
        `INSERT INTO users (username, email, password_hash, name, country, alien, approved, invite_code_used)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          username,
          email,
          passwordHash,
          name,
          country || null,
          alienStr,
          approved || false,
          inviteCodeUsed || null,
        ],
      );

      await client.query("COMMIT");
      return insertRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  /* ===============================
     🎟️ Invite Codes
     =============================== */
  async validateInviteCode(code: string) {
    const result = await pool.query(
      `SELECT * FROM invite_codes 
       WHERE code = $1 
       AND is_active = true 
       AND (expires_at IS NULL OR expires_at > NOW())
       AND current_uses < max_uses`,
      [code],
    );
    return result.rows[0];
  },

  async markInviteCodeUsed(code: string, userId: string) {
    await pool.query(
      `UPDATE invite_codes 
       SET current_uses = current_uses + 1, used_by = $2
       WHERE code = $1`,
      [code, userId],
    );
  },

  async createInviteCode(
    createdBy: string,
    maxUses: number = 1,
    expiresAt?: Date,
  ) {
    const code =
      Math.random().toString(36).substring(2, 10).toUpperCase() +
      Math.random().toString(36).substring(2, 6).toUpperCase();
    const result = await pool.query(
      `INSERT INTO invite_codes (code, created_by, max_uses, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [code, createdBy, maxUses, expiresAt || null],
    );
    return result.rows[0];
  },

  async getAllInviteCodes() {
    const result = await pool.query(
      `SELECT ic.*, u.username as created_by_username 
       FROM invite_codes ic
       LEFT JOIN users u ON ic.created_by = u.id
       ORDER BY ic.created_at DESC`,
    );
    return result.rows;
  },

  async getUsersByInviteCode(code: string) {
    const result = await pool.query(
      `SELECT id, username, name, email, created_at
       FROM users
       WHERE invite_code_used = $1
       ORDER BY created_at DESC`,
      [code],
    );
    return result.rows;
  },

  async deactivateInviteCode(codeId: string) {
    const result = await pool.query(
      `UPDATE invite_codes 
       SET is_active = false
       WHERE id = $1
       RETURNING *`,
      [codeId],
    );
    return result.rows[0];
  },

  async getPendingUsers() {
    const result = await pool.query(
      `SELECT id, username, email, name, country, alien, created_at
       FROM users
       WHERE approved = false
       ORDER BY created_at DESC`,
    );
    return result.rows;
  },

  async approveUser(userId: string) {
    const result = await pool.query(
      `UPDATE users 
       SET approved = true
       WHERE id = $1
       RETURNING *`,
      [userId],
    );
    return result.rows[0];
  },

  async rejectUser(userId: string) {
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
  },

  async deleteUser(userId: string) {
    await pool.query(
      `UPDATE invite_codes SET used_by = NULL WHERE used_by = $1`,
      [userId],
    );
    await pool.query(`DELETE FROM flights WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM stayins WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
  },

  /* ===============================
     ✈️ Flights
     =============================== */
  async getUserFlights(userId: string) {
    const result = await pool.query(
      `SELECT *
       FROM flights
       WHERE user_id = $1
       ORDER BY date DESC`,
      [userId],
    );
    return result.rows;
  },

  async createFlight(flight: FlightInput) {
    const result = await pool.query(
      `INSERT INTO flights (
       user_id, airline_name, flight_number, departure, arrival,
       departure_latitude, departure_longitude, arrival_latitude, arrival_longitude,
       date, departure_time, arrival_time, aircraft_type, distance, duration, status,
       departure_terminal, arrival_terminal
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
      [
        flight.userId,
        flight.airlineName,
        flight.flightNumber,
        flight.departure,
        flight.arrival,
        flight.departureLatitude ?? null,
        flight.departureLongitude ?? null,
        flight.arrivalLatitude ?? null,
        flight.arrivalLongitude ?? null,
        flight.date,
        flight.departureTime ?? null,
        flight.arrivalTime ?? null,
        flight.aircraftType ?? null,
        flight.distance ?? 0,
        flight.duration ?? null,
        flight.status ?? "scheduled",
        flight.departure_terminal ?? null,
        flight.arrival_terminal ?? null,
      ],
    );
    return result.rows[0];
  },

  /* ===============================
     📧 Contact Messages
     =============================== */
  async createContactMessage(
    name: string,
    email: string,
    subject: string,
    message: string,
  ) {
    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message, is_read, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())
       RETURNING *`,
      [name, email, subject, message],
    );
    return result.rows[0];
  },

  async getAllContactMessages() {
    const result = await pool.query(
      `SELECT * FROM contact_messages ORDER BY created_at DESC`,
    );
    return result.rows;
  },

  async markMessageAsRead(messageId: string) {
    const result = await pool.query(
      `UPDATE contact_messages SET is_read = true WHERE id = $1 RETURNING *`,
      [messageId],
    );
    return result.rows[0];
  },

  async replyToContactMessage(messageId: string, reply: string) {
    const result = await pool.query(
      `UPDATE contact_messages SET admin_reply = $1, replied_at = NOW() WHERE id = $2 RETURNING *`,
      [reply, messageId],
    );
    return result.rows[0];
  },

  async deleteContactMessage(messageId: string) {
    await pool.query(`DELETE FROM contact_messages WHERE id = $1`, [messageId]);
  },

  async getUserContactMessages(email: string) {
    const result = await pool.query(
      `SELECT * FROM contact_messages WHERE email = $1 ORDER BY created_at DESC`,
      [email],
    );
    return result.rows;
  },

  async userReplyToMessage(messageId: string, email: string, reply: string) {
    const result = await pool.query(
      `UPDATE contact_messages 
       SET user_reply = $1, user_replied_at = NOW() 
       WHERE id = $2 AND email = $3 
       RETURNING *`,
      [reply, messageId, email],
    );
    return result.rows[0];
  },
  /* ===============================
   🌍 User Location Update
   =============================== */
  async updateUserLocation(
    userId: string,
    latitude: number,
    longitude: number,
  ) {
    try {
      const result = await pool.query(
        `UPDATE users
       SET latitude = $1, longitude = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, username, email, name, country, alien, latitude, longitude, updated_at`,
        [latitude, longitude, userId],
      );
      return result.rows[0]; // Return the updated user data
    } catch (err) {
      console.error("Error updating user location:", err);
      throw err;
    }
  },
  /* ===============================
     📝 User Profile Updates
     =============================== */
  async updateUserProfile(
    userId: string,
    data: { name: string; username: string; email: string; country: string },
  ) {
    const result = await pool.query(
      `UPDATE users 
       SET name = $1, username = $2, email = $3, country = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, username, email, name, country, alien, is_admin AS "isAdmin"`,
      [data.name, data.username, data.email, data.country, userId],
    );
    return result.rows[0];
  },

  async updateUserPassword(userId: string, passwordHash: string) {
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId],
    );
  },

  async updateProfileSetup(
    userId: string,
    data: {
      profile_icon: string;
      profile_color: string;
      profile_setup_complete: boolean;
    },
  ) {
    const result = await pool.query(
      `UPDATE users 
       SET profile_icon = $1, profile_color = $2, profile_setup_complete = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, email, name, country, alien, profile_icon, profile_color, profile_setup_complete, is_admin AS "isAdmin"`,
      [
        data.profile_icon,
        data.profile_color,
        data.profile_setup_complete,
        userId,
      ],
    );
    return result.rows[0];
  },

  async updateProfileIcon(userId: string, profile_icon: string) {
    const result = await pool.query(
      `UPDATE users 
       SET profile_icon = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, name, country, alien, profile_icon, profile_color, profile_setup_complete, is_admin AS "isAdmin"`,
      [profile_icon, userId],
    );
    return result.rows[0];
  },
};
