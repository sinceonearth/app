import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import dotenv from "dotenv";
import { sql, eq, desc, and } from "drizzle-orm";
import crypto from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { db } from "./db";
import { storage, pool } from "./storage";
import { flights, airports, stayins, users, contactMessages,
radrGroups, radrGroupMembers, radrMessages } from "@shared/schema";

import authRouter from "./auth";
import { verifyToken } from "./jwt";
import { 
  sendGroupInviteNotification, 
  sendNewMessageNotification, 
  sendArrivalNotification,
  sendAchievementNotification,
  sendTripCompletedNotification
} from "./notifications";


import {
  radrGroupsRelations,
  radrGroupMembersRelations,
  radrMessagesRelations
} from "@shared/relations";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const airportsData = JSON.parse(readFileSync(join(__dirname, "../client/src/airports.json"), "utf-8"));

dotenv.config();

/* =========================
   Request with user type
========================= */
export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
    country?: string | null;
    alien?: string | null;
    isAdmin?: boolean;
  };
}

/* =========================
   Auth middleware
========================= */
export function requireAuth(req: RequestWithUser, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing Authorization header" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: "Invalid or expired token" });

  req.user = {
    userId: decoded.userId,
    email: decoded.email,
    username: decoded.username,
    country: decoded.country ?? null,
    alien: decoded.alien ?? null,
    isAdmin: decoded.isAdmin ?? false,
  };

  next();
}

export function requireAdmin(req: RequestWithUser, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Admins only" });
  next();
}

/* =========================
   Register routes
========================= */
export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/auth", authRouter);

  // --- Get all users for invite dropdown (authenticated users only) ---
  app.get("/api/users/search", requireAuth, async (_req, res) => {
    try {
      const usersList = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        alien: users.alien,
        profile_icon: users.profile_icon,
        profile_color: users.profile_color
      }).from(users).where(eq(users.approved, true));
      
      return res.json(usersList);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // --- Admin: list all users ---
  app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const usersList = await storage.getAllUsers();
      return res.json(usersList.map(({ password_hash, ...u }) => ({ ...u, country: u.country ?? null })));
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // --- Admin: get pending users ---
  app.get("/api/admin/pending-users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      return res.json(pendingUsers);
    } catch (err) {
      console.error("❌ Error fetching pending users:", err);
      return res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  // --- Admin: approve user ---
  app.post("/api/admin/approve-user/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.approveUser(userId);
      return res.json({ message: "User approved", user });
    } catch (err) {
      console.error("❌ Error approving user:", err);
      return res.status(500).json({ message: "Failed to approve user" });
    }
  });

  // --- Admin: reject user ---
  app.delete("/api/admin/reject-user/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.rejectUser(userId);
      return res.json({ message: "User rejected" });
    } catch (err) {
      console.error("❌ Error rejecting user:", err);
      return res.status(500).json({ message: "Failed to reject user" });
    }
  });

  // --- Admin: delete user ---
  app.delete("/api/admin/delete-user/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteUser(userId);
      return res.json({ message: "User deleted" });
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      return res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // --- Admin: create invite code ---
  app.post("/api/admin/invite-codes", requireAuth, requireAdmin, async (req: RequestWithUser, res) => {
    try {
      const { maxUses, expiresAt } = req.body;
      const code = await storage.createInviteCode(
        req.user!.userId,
        maxUses || 1,
        expiresAt ? new Date(expiresAt) : undefined
      );
      return res.json(code);
    } catch (err) {
      console.error("❌ Error creating invite code:", err);
      return res.status(500).json({ message: "Failed to create invite code" });
    }
  });

  // --- Admin: list invite codes ---
  app.get("/api/admin/invite-codes", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const codes = await storage.getAllInviteCodes();
      return res.json(codes);
    } catch (err) {
      console.error("❌ Error fetching invite codes:", err);
      return res.status(500).json({ message: "Failed to fetch invite codes" });
    }
  });

  // --- Admin: deactivate invite code ---
  app.patch("/api/admin/invite-codes/:codeId/deactivate", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { codeId } = req.params;
      const code = await storage.deactivateInviteCode(codeId);
      return res.json({ message: "Code deactivated", code });
    } catch (err) {
      console.error("❌ Error deactivating invite code:", err);
      return res.status(500).json({ message: "Failed to deactivate invite code" });
    }
  });

  // --- Admin: get users by invite code ---
  app.get("/api/admin/invite-codes/:code/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { code } = req.params;
      const users = await storage.getUsersByInviteCode(code);
      return res.json(users);
    } catch (err) {
      console.error("❌ Error fetching users by invite code:", err);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // --- Get public stats for landing page ---
  app.get("/api/public/stats", async (_req, res) => {
    try {
      // Get total flights count
      const totalFlightsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(flights);
      const totalFlights = totalFlightsResult[0]?.count || 0;

      // Get unique countries using airport codes (same logic as Achievements page)
      const allFlights = await db
        .select({ arrival: flights.arrival })
        .from(flights);

      const countriesSet = new Set<string>();
      
      allFlights.forEach(f => {
        if (f.arrival) {
          const trimmed = f.arrival.trim();
          // Check both IATA (3-letter) and ICAO (4-letter) codes
          const airport = airportsData.find((a: any) => a.iata === trimmed || a.icao === trimmed);
          if (airport?.iso_country) {
            countriesSet.add(airport.iso_country.toLowerCase());
          }
        }
      });
      
      const totalCountries = countriesSet.size;

      // Get total approved users
      const totalUsersResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.approved, true));
      const totalUsers = totalUsersResult[0]?.count || 0;

      return res.json({
        totalFlights,
        totalCountries,
        totalUsers,
        userRating: 4.9 // Static rating for now
      });
    } catch (err) {
      console.error("❌ Error fetching public stats:", err);
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // --- List flights for logged-in user ---
  app.get("/api/flights", requireAuth, async (req: RequestWithUser, res) => {
    try {
      // First, update flight statuses for past flights (excluding today)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      await db
        .update(flights)
        .set({ status: "Landed" })
        .where(
          and(
            eq(flights.user_id, req.user!.userId),
            sql`LOWER(${flights.status}) = 'scheduled'`,
            sql`${flights.date} < ${today}`
          )
        );
      
      // Fetch all flights
      const flightsList = await db
        .select()
        .from(flights)
        .where(eq(flights.user_id, req.user!.userId))
        .orderBy(desc(flights.date));
      return res.json(flightsList || []);
    } catch (err) {
      console.error("❌ Error fetching flights:", err);
      return res.status(500).json({ message: "Failed to fetch flights" });
    }
  });

  // --- Add flight ---
  app.post("/api/flights", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const body = req.body;
      const userId = req.user!.userId;

      if (!body.date || !body.flight_number || !body.departure || !body.arrival || !body.status) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const findAirport = async (code: string) => {
        if (!code) return null;
        const result = await db
          .select()
          .from(airports)
          .where(eq(airports.iata, code))
          .limit(1);
        return result[0] ?? null;
      };

      const depAirport = await findAirport(body.departure);
      const arrAirport = await findAirport(body.arrival);

      const newFlight = {
        id: crypto.randomUUID(),
        user_id: userId,
        date: body.date,
        flight_number: body.flight_number,
        departure: depAirport?.iata ?? depAirport?.ident ?? body.departure,
        arrival: arrAirport?.iata ?? arrAirport?.ident ?? body.arrival,
        departure_time: body.departure_time ?? null,
        arrival_time: body.arrival_time ?? null,
        aircraft_type: body.aircraft_type ?? null,
        status: body.status,
        created_at: new Date(),
        airline_name: body.airline_name ?? null,
        departure_terminal: body.departure_terminal ?? null,
        arrival_terminal: body.arrival_terminal ?? null,
        departure_latitude: body.departure_latitude ?? depAirport?.latitude ?? null,
        departure_longitude: body.departure_longitude ?? depAirport?.longitude ?? null,
        arrival_latitude: body.arrival_latitude ?? arrAirport?.latitude ?? null,
        arrival_longitude: body.arrival_longitude ?? arrAirport?.longitude ?? null,
        duration: body.duration ?? null,
        distance: body.distance ? Number(body.distance) : null,
        airline_code: body.airline_code ?? null,
      };

      await db.insert(flights).values(newFlight);
      return res.status(201).json({ message: "Flight added successfully", flight: newFlight });
    } catch (err) {
      console.error("❌ Error adding flight:", err);
      return res.status(500).json({ message: "Failed to add flight" });
    }
  });

  // --- Delete flight ---
  app.delete("/api/flights/:id", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const { id } = req.params;
      const deleted = await db
        .delete(flights)
        .where(and(eq(flights.id, id), eq(flights.user_id, req.user!.userId)));
      if (!deleted) return res.status(404).json({ message: "Flight not found" });
      return res.json({ message: "Flight deleted successfully" });
    } catch (err) {
      console.error("❌ Error deleting flight:", err);
      return res.status(500).json({ message: "Failed to delete flight" });
    }
  });

  // --- List stay ins for logged-in user ---
  app.get("/api/stayins", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const stayinsList = await db
        .select()
        .from(stayins)
        .where(eq(stayins.user_id, req.user!.userId))
        .orderBy(desc(stayins.check_in));
      return res.json(stayinsList || []);
    } catch (err) {
      console.error("❌ Error fetching stay ins:", err);
      return res.status(500).json({ message: "Failed to fetch stay ins" });
    }
  });

  // --- Add stay in ---
  app.post("/api/stayins", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const body = req.body;
      const userId = req.user!.userId;

      if (!body.name || !body.city || !body.country || !body.check_in || !body.check_out || !body.type) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newStayIn = {
        id: crypto.randomUUID(),
        user_id: userId,
        name: body.name,
        city: body.city,
        country: body.country,
        check_in: body.check_in,
        check_out: body.check_out,
        maps_pin: body.maps_pin || null,
        type: body.type,
        created_at: new Date(),
      };

      await db.insert(stayins).values(newStayIn);
      return res.status(201).json({ message: "Stay in added successfully", stayin: newStayIn });
    } catch (err) {
      console.error("❌ Error adding stay in:", err);
      return res.status(500).json({ message: "Failed to add stay in" });
    }
  });

  // --- Delete stay in ---
  app.delete("/api/stayins/:id", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const { id } = req.params;
      const deleted = await db
        .delete(stayins)
        .where(and(eq(stayins.id, id), eq(stayins.user_id, req.user!.userId)));
      if (!deleted) return res.status(404).json({ message: "Stay in not found" });
      return res.json({ message: "Stay in deleted successfully" });
    } catch (err) {
      console.error("❌ Error deleting stay in:", err);
      return res.status(500).json({ message: "Failed to delete stay in" });
    }
  });

  // --- Search flights (local DB only) ---
  app.get("/api/flights/search", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const { flight_number, airline_name, dep_iata, arr_iata, date } = req.query;

      if (!date) return res.status(400).json({ message: "Date is required" });

      const conditions = [eq(flights.user_id, req.user!.userId), eq(flights.date, date as string)];

      if (flight_number) conditions.push(eq(flights.flight_number, flight_number as string));
      if (airline_name) conditions.push(sql`${flights.airline_name} ILIKE ${'%' + (airline_name as string) + '%'}`);
      if (dep_iata) conditions.push(eq(flights.departure, dep_iata as string));
      if (arr_iata) conditions.push(eq(flights.arrival, arr_iata as string));

      const flightsList = await db
        .select()
        .from(flights)
        .where(and(...conditions))
        .orderBy(desc(flights.date));

      return res.json(flightsList);
    } catch (err) {
      console.error("❌ Error searching flights:", err);
      return res.status(500).json({ message: "Failed to search flights" });
    }
  });

  // --- Contact form submission (public) ---
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const contactMessage = await storage.createContactMessage(name, email, subject, message);
      return res.status(201).json({ message: "Message sent successfully", contactMessage });
    } catch (err) {
      console.error("❌ Error saving contact message:", err);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  // --- Admin: get all contact messages ---
  app.get("/api/admin/contact-messages", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      return res.json(messages);
    } catch (err) {
      console.error("❌ Error fetching contact messages:", err);
      return res.status(500).json({ message: "Failed to fetch contact messages" });
    }
  });

  // --- Admin: mark message as read ---
  app.patch("/api/admin/contact-messages/:messageId/read", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { messageId } = req.params;
      const message = await storage.markMessageAsRead(messageId);
      return res.json({ message: "Message marked as read", data: message });
    } catch (err) {
      console.error("❌ Error marking message as read:", err);
      return res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // --- Admin: delete contact message ---
  app.delete("/api/admin/contact-messages/:messageId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { messageId } = req.params;
      await storage.deleteContactMessage(messageId);
      return res.json({ message: "Message deleted" });
    } catch (err) {
      console.error("❌ Error deleting message:", err);
      return res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // --- Admin: reply to contact message ---
  app.patch("/api/admin/contact-messages/:messageId/reply", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { messageId } = req.params;
      const { reply } = req.body;
      if (!reply || reply.trim() === "") {
        return res.status(400).json({ message: "Reply cannot be empty" });
      }
      const message = await storage.replyToContactMessage(messageId, reply);
      return res.json({ message: "Reply sent successfully", data: message });
    } catch (err) {
      console.error("❌ Error replying to message:", err);
      return res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // --- User: get own contact messages ---
  app.get("/api/contact-messages", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const email = req.user!.email;
      const messages = await storage.getUserContactMessages(email);
      return res.json(messages);
    } catch (err) {
      console.error("❌ Error fetching user messages:", err);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // --- User: reply to admin message ---
  app.patch("/api/contact-messages/:messageId/user-reply", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const { messageId } = req.params;
      const { reply } = req.body;
      const email = req.user!.email;

      if (!reply || reply.trim() === "") {
        return res.status(400).json({ message: "Reply cannot be empty" });
      }

      const message = await storage.userReplyToMessage(messageId, email, reply);
      if (!message) {
        return res.status(404).json({ message: "Message not found or you don't have permission" });
      }

      return res.json({ message: "Reply sent successfully", data: message });
    } catch (err) {
      console.error("❌ Error sending user reply:", err);
      return res.status(500).json({ message: "Failed to send reply" });
    }
  });

// --- Radar: update & get nearby users ---
const activeUsers = new Map<
  string,
  { userId: string; username: string; lat: number; lng: number; lastSeen: number; profile_icon?: string; profile_color?: string }
>();

app.post("/api/radr/update", requireAuth, async (req: RequestWithUser, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ message: "Invalid coordinates" });
  }

  const userId = req.user!.userId;
  const username = req.user!.username;
  const now = Date.now();

  // Fetch user's profile icon and color from database
  const userProfile = await storage.getUserById(userId);
  const profile_icon = userProfile?.profile_icon;
  const profile_color = userProfile?.profile_color;

  activeUsers.set(userId, { userId, username, lat, lng, lastSeen: now, profile_icon, profile_color });

  // Remove users who haven't updated in 2 minutes
  const cutoff = now - 2 * 60 * 1000;
  for (const [id, u] of activeUsers.entries()) {
    if (u.lastSeen < cutoff) activeUsers.delete(id);
  }

  return res.json({ message: "Location updated" });
});

app.get("/api/radr/nearby", requireAuth, async (req: RequestWithUser, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: "Missing coordinates" });

  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);

  const toRad = (v: number) => (v * Math.PI) / 180;
  const distanceKm = (a: any, b: any) => {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const nearby = [...activeUsers.values()]
    .filter((u) => u.userId !== req.user!.userId)
    .map((u) => ({
      ...u,
      distance: distanceKm({ lat: userLat, lng: userLng }, u),
    }))
    .filter((u) => u.distance <= 10); // within 10 km

  return res.json({ nearby });
});

// --- Radr: location-activated groups ---
app.post("/api/radr/groups", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const { targetName, targetLat, targetLng, targetRadiusKm, expiresInHours, inviteUsernames, encryptionKey } = req.body;
    
    if (!targetName || typeof targetLat !== 'number' || typeof targetLng !== 'number') {
      return res.status(400).json({ message: "Target location details required" });
    }

    if (!encryptionKey) {
      return res.status(400).json({ message: "Encryption key required" });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expiresInHours || 24));

    const group = await pool.query(
      `INSERT INTO radr_groups (creator_id, target_name, target_lat, target_lng, target_radius_km, expires_at, encryption_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user!.userId, targetName, targetLat, targetLng, targetRadiusKm || 10, expiresAt, encryptionKey]
    );

    await pool.query(
      `INSERT INTO radr_group_members (group_id, user_id, has_arrived)
       VALUES ($1, $2, false)`,
      [group.rows[0].id, req.user!.userId]
    );

    if (inviteUsernames && Array.isArray(inviteUsernames)) {
      for (const username of inviteUsernames) {
        const userResult = await pool.query(`SELECT id FROM users WHERE username = $1`, [username]);
        if (userResult.rows[0]) {
          await pool.query(
            `INSERT INTO radr_group_members (group_id, user_id, has_arrived)
             VALUES ($1, $2, false) ON CONFLICT DO NOTHING`,
            [group.rows[0].id, userResult.rows[0].id]
          );
        }
      }
    }

    return res.status(201).json({ message: "Group created", group: group.rows[0] });
  } catch (err) {
    console.error("❌ Error creating radr group:", err);
    return res.status(500).json({ message: "Failed to create group" });
  }
});

app.post("/api/radr/groups/:groupId/invite", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const { groupId } = req.params;
    const { username } = req.body;
    
    const userResult = await pool.query(`SELECT id FROM users WHERE username = $1`, [username]);
    if (!userResult.rows[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    await pool.query(
      `INSERT INTO radr_group_members (group_id, user_id, has_arrived)
       VALUES ($1, $2, false) ON CONFLICT DO NOTHING`,
      [groupId, userResult.rows[0].id]
    );

    return res.json({ message: "User invited successfully" });
  } catch (err) {
    console.error("❌ Error inviting user:", err);
    return res.status(500).json({ message: "Failed to invite user" });
  }
});

app.post("/api/radr/groups/:groupId/check-arrival", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const { groupId } = req.params;
    const { lat, lng } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const groupResult = await pool.query(`SELECT * FROM radr_groups WHERE id = $1`, [groupId]);
    if (!groupResult.rows[0]) {
      return res.status(404).json({ message: "Group not found" });
    }

    const group = groupResult.rows[0];
    
    const memberResult = await pool.query(
      `SELECT * FROM radr_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, req.user!.userId]
    );

    if (!memberResult.rows[0]) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    if (memberResult.rows[0].has_arrived) {
      return res.json({ alreadyArrived: true, message: "You have already arrived" });
    }

    const toRad = (deg: number) => deg * (Math.PI / 180);
    const R = 6371;
    const dLat = toRad(group.target_lat - lat);
    const dLng = toRad(group.target_lng - lng);
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(toRad(lat)) * Math.cos(toRad(group.target_lat)) * 
              Math.sin(dLng / 2) ** 2;
    const distance = 2 * R * Math.asin(Math.sqrt(a));

    if (distance <= group.target_radius_km) {
      await pool.query(
        `UPDATE radr_group_members SET has_arrived = true, arrived_at = NOW()
         WHERE group_id = $1 AND user_id = $2`,
        [groupId, req.user!.userId]
      );

      const userResult = await pool.query(`SELECT name, username, country FROM users WHERE id = $1`, [req.user!.userId]);
      const user = userResult.rows[0];
      const displayName = user.name || user.username;

      await pool.query(
        `INSERT INTO radr_messages (group_id, user_id, type, content, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          groupId, 
          req.user!.userId, 
          'arrival', 
          `${displayName} has entered ${group.target_name}`,
          JSON.stringify({ country: user.country, location: group.target_name })
        ]
      );

      const otherMembers = await pool.query(
        `SELECT user_id FROM radr_group_members 
         WHERE group_id = $1 AND user_id != $2`,
        [groupId, req.user!.userId]
      );

      if (otherMembers.rows.length > 0) {
        const recipientIds = otherMembers.rows.map(r => r.user_id);
        sendArrivalNotification(recipientIds, displayName, group.target_name, parseInt(groupId)).catch(console.error);
      }

      return res.json({ 
        arrived: true, 
        message: "Arrival recorded! Welcome to " + group.target_name 
      });
    }

    return res.json({ 
      withinRadius: false, 
      distance: Math.round(distance * 10) / 10,
      message: `You are ${Math.round(distance)} km away from ${group.target_name}` 
    });
  } catch (err) {
    console.error("❌ Error checking arrival:", err);
    return res.status(500).json({ message: "Failed to check arrival" });
  }
});

app.post("/api/radr/groups/:groupId/messages", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Message content required" });
    }

    const memberCheck = await pool.query(
      `SELECT * FROM radr_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, req.user!.userId]
    );

    if (!memberCheck.rows[0]) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    const message = await pool.query(
      `INSERT INTO radr_messages (group_id, user_id, type, content, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [groupId, req.user!.userId, 'text', content, JSON.stringify({})]
    );

    const groupInfo = await pool.query(
      `SELECT g.target_name, u.name, u.username 
       FROM radr_groups g 
       JOIN users u ON u.id = $1 
       WHERE g.id = $2`,
      [req.user!.userId, groupId]
    );

    const otherMembers = await pool.query(
      `SELECT user_id FROM radr_group_members 
       WHERE group_id = $1 AND user_id != $2`,
      [groupId, req.user!.userId]
    );

    if (groupInfo.rows[0] && otherMembers.rows.length > 0) {
      const senderName = groupInfo.rows[0].name || groupInfo.rows[0].username;
      const groupName = groupInfo.rows[0].target_name;
      const recipientIds = otherMembers.rows.map(r => r.user_id);
      
      sendNewMessageNotification(recipientIds, senderName, groupName, parseInt(groupId)).catch(console.error);
    }

    return res.status(201).json({ message: "Message sent", data: message.rows[0] });
  } catch (err) {
    console.error("❌ Error sending radr message:", err);
    return res.status(500).json({ message: "Failed to send message" });
  }
});

app.get("/api/radr/groups/:groupId/messages", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const { groupId } = req.params;
    
    const messages = await pool.query(
      `SELECT m.*, u.username, u.name
       FROM radr_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.group_id = $1
       ORDER BY m.created_at ASC`,
      [groupId]
    );

    return res.json({ messages: messages.rows });
  } catch (err) {
    console.error("❌ Error fetching radr messages:", err);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
});

app.get("/api/radr/groups", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const groups = await pool.query(
      `SELECT g.id, g.creator_id, g.target_name, g.target_lat, g.target_lng, 
              g.target_radius_km, g.expires_at, g.created_at, g.encryption_key,
              m.has_arrived, m.arrived_at,
              (SELECT COUNT(*) FROM radr_group_members WHERE group_id = g.id) as member_count,
              (SELECT COUNT(*) FROM radr_group_members WHERE group_id = g.id AND has_arrived = true) as arrived_count,
              (g.creator_id = $1) as is_creator,
              (
                SELECT json_agg(
                  json_build_object(
                    'user_id', gm.user_id,
                    'username', u.username,
                    'name', u.name,
                    'has_arrived', gm.has_arrived,
                    'profile_icon', u.profile_icon,
                    'profile_color', u.profile_color
                  )
                )
                FROM radr_group_members gm
                JOIN users u ON gm.user_id = u.id
                WHERE gm.group_id = g.id
              ) as members
       FROM radr_groups g
       JOIN radr_group_members m ON g.id = m.group_id
       WHERE m.user_id = $1 AND g.expires_at > NOW()
       ORDER BY g.created_at DESC`,
      [req.user!.userId]
    );

    return res.json({ groups: groups.rows });
  } catch (err) {
    console.error("❌ Error fetching radr groups:", err);
    return res.status(500).json({ message: "Failed to fetch groups" });
  }
});

app.post("/api/radr/groups/:groupId/leave", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const { groupId } = req.params;
    
    const groupResult = await pool.query(
      `SELECT creator_id FROM radr_groups WHERE id = $1`,
      [groupId]
    );

    if (!groupResult.rows[0]) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (groupResult.rows[0].creator_id === req.user!.userId) {
      return res.status(403).json({ message: "Group creator cannot leave. Delete the group instead." });
    }

    // Get user info for leave message
    const userResult = await pool.query(
      `SELECT username, name FROM users WHERE id = $1`,
      [req.user!.userId]
    );
    const userName = userResult.rows[0]?.name || userResult.rows[0]?.username || 'Someone';

    await pool.query(
      `DELETE FROM radr_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, req.user!.userId]
    );

    // Insert leave system message
    await pool.query(
      `INSERT INTO radr_messages (group_id, user_id, content, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [groupId, req.user!.userId, `${userName} left the group`, 'leave']
    );

    return res.json({ message: "Left group successfully" });
  } catch (err) {
    console.error("❌ Error leaving radr group:", err);
    return res.status(500).json({ message: "Failed to leave group" });
  }
});

app.post("/api/radr/groups/:groupId/add-members", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const { groupId } = req.params;
    const { usernames } = req.body;

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ message: "Invalid usernames" });
    }

    const groupResult = await pool.query(
      `SELECT creator_id FROM radr_groups WHERE id = $1`,
      [groupId]
    );

    if (!groupResult.rows[0]) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (groupResult.rows[0].creator_id !== req.user!.userId) {
      return res.status(403).json({ message: "Only the group creator can add members" });
    }

    const usersResult = await pool.query(
      `SELECT id FROM users WHERE username = ANY($1)`,
      [usernames]
    );

    const groupInfo = await pool.query(
      `SELECT g.target_name, u.name, u.username 
       FROM radr_groups g 
       JOIN users u ON u.id = $1 
       WHERE g.id = $2`,
      [req.user!.userId, groupId]
    );

    for (const user of usersResult.rows) {
      await pool.query(
        `INSERT INTO radr_group_members (group_id, user_id, has_arrived) 
         VALUES ($1, $2, false) 
         ON CONFLICT (group_id, user_id) DO NOTHING`,
        [groupId, user.id]
      );

      if (groupInfo.rows[0]) {
        const inviterName = groupInfo.rows[0].name || groupInfo.rows[0].username;
        const groupName = groupInfo.rows[0].target_name;
        sendGroupInviteNotification(user.id, inviterName, groupName, parseInt(groupId)).catch(console.error);
      }
    }

    return res.json({ message: "Members added successfully" });
  } catch (err) {
    console.error("❌ Error adding members:", err);
    return res.status(500).json({ message: "Failed to add members" });
  }
});

app.post("/api/radr/groups/:groupId/remove-member", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const groupResult = await pool.query(
      `SELECT creator_id FROM radr_groups WHERE id = $1`,
      [groupId]
    );

    if (!groupResult.rows[0]) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (groupResult.rows[0].creator_id !== req.user!.userId) {
      return res.status(403).json({ message: "Only the group creator can remove members" });
    }

    if (groupResult.rows[0].creator_id === userId) {
      return res.status(403).json({ message: "Cannot remove the group creator" });
    }

    // Get user info for leave message
    const userResult = await pool.query(
      `SELECT username, name FROM users WHERE id = $1`,
      [userId]
    );
    const userName = userResult.rows[0]?.name || userResult.rows[0]?.username || 'Someone';

    await pool.query(
      `DELETE FROM radr_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );

    // Insert leave system message
    await pool.query(
      `INSERT INTO radr_messages (group_id, user_id, content, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [groupId, userId, `${userName} was removed from the group`, 'leave']
    );

    return res.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("❌ Error removing member:", err);
    return res.status(500).json({ message: "Failed to remove member" });
  }
});

app.delete("/api/radr/groups/:groupId", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const { groupId } = req.params;
    
    const groupResult = await pool.query(
      `SELECT creator_id FROM radr_groups WHERE id = $1`,
      [groupId]
    );

    if (!groupResult.rows[0]) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (groupResult.rows[0].creator_id !== req.user!.userId) {
      return res.status(403).json({ message: "Only the group creator can delete this group" });
    }

    await pool.query(`DELETE FROM radr_groups WHERE id = $1`, [groupId]);
    return res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting radr group:", err);
    return res.status(500).json({ message: "Failed to delete group" });
  }
});

app.delete("/api/radr/messages/:messageId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { messageId } = req.params;
    await pool.query(`DELETE FROM radr_messages WHERE id = $1`, [messageId]);
    return res.json({ message: "Radr message deleted" });
  } catch (err) {
    console.error("❌ Error deleting radr message:", err);
    return res.status(500).json({ message: "Failed to delete radr message" });
  }
});

app.post("/api/notifications/register", requireAuth, async (req: RequestWithUser, res) => {
  try {
    const { push_token } = req.body;
    
    if (!push_token) {
      return res.status(400).json({ message: "push_token is required" });
    }

    await pool.query(
      `UPDATE users SET push_token = $1 WHERE id = $2`,
      [push_token, req.user!.userId]
    );

    console.log(`✅ Push token registered for user ${req.user!.userId}`);
    return res.json({ message: "Push token registered successfully" });
  } catch (err) {
    console.error("❌ Error registering push token:", err);
    return res.status(500).json({ message: "Failed to register push token" });
  }
});



  return createServer(app);
}
