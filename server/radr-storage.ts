import { pool } from "./storage";

export const radrStorage = {
  async createGroup(data: {
    targetName: string;
    targetLat: number;
    targetLng: number;
    targetRadiusKm: number;
    expiresAt: Date;
    creatorId: string;
  }) {
    const result = await pool.query(
      `INSERT INTO radr_groups (target_name, target_lat, target_lng, target_radius_km, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.targetName, data.targetLat, data.targetLng, data.targetRadiusKm, data.expiresAt]
    );
    const group = result.rows[0];
    
    await this.addMember(group.id, data.creatorId);
    
    return group;
  },

  async getGroup(groupId: string) {
    const result = await pool.query(
      `SELECT * FROM radr_groups WHERE id = $1`,
      [groupId]
    );
    return result.rows[0];
  },

  async addMember(groupId: string, userId: string) {
    try {
      const result = await pool.query(
        `INSERT INTO radr_group_members (group_id, user_id, has_arrived)
         VALUES ($1, $2, false)
         RETURNING *`,
        [groupId, userId]
      );
      return result.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        const existing = await pool.query(
          `SELECT * FROM radr_group_members WHERE group_id = $1 AND user_id = $2`,
          [groupId, userId]
        );
        return existing.rows[0];
      }
      throw err;
    }
  },

  async checkAndMarkArrival(groupId: string, userId: string, userLat: number, userLng: number) {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error("Group not found");

    const member = await pool.query(
      `SELECT * FROM radr_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );

    if (!member.rows[0]) throw new Error("User not a member of this group");
    if (member.rows[0].has_arrived) return { alreadyArrived: true };

    const distance = this.calculateDistance(
      userLat, userLng,
      group.target_lat, group.target_lng
    );

    if (distance <= group.target_radius_km) {
      const result = await pool.query(
        `UPDATE radr_group_members
         SET has_arrived = true, arrived_at = NOW()
         WHERE group_id = $1 AND user_id = $2
         RETURNING *`,
        [groupId, userId]
      );

      const user = await pool.query(
        `SELECT username, name, country FROM users WHERE id = $1`,
        [userId]
      );

      const arrivalMessage = await this.addMessage(
        groupId,
        userId,
        'arrival',
        `${user.rows[0].name || user.rows[0].username} has entered ${group.target_name}`,
        { country: user.rows[0].country, location: group.target_name }
      );

      return { 
        justArrived: true, 
        member: result.rows[0],
        message: arrivalMessage
      };
    }

    return { withinRadius: false, distance };
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  },

  async getGroupMembers(groupId: string) {
    const result = await pool.query(
      `SELECT m.*, u.username, u.name, u.country
       FROM radr_group_members m
       JOIN users u ON m.user_id = u.id
       WHERE m.group_id = $1
       ORDER BY m.arrived_at ASC NULLS LAST`,
      [groupId]
    );
    return result.rows;
  },

  async addMessage(
    groupId: string,
    userId: string,
    type: string,
    content: string,
    metadata: any = {}
  ) {
    const result = await pool.query(
      `INSERT INTO radr_messages (group_id, user_id, type, content, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [groupId, userId, type, content, JSON.stringify(metadata)]
    );
    return result.rows[0];
  },

  async getMessages(groupId: string) {
    const result = await pool.query(
      `SELECT m.*, u.username, u.name
       FROM radr_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.group_id = $1
       ORDER BY m.created_at ASC`,
      [groupId]
    );
    return result.rows;
  },

  async getUserGroups(userId: string) {
    const result = await pool.query(
      `SELECT g.*, m.has_arrived, m.arrived_at,
              (SELECT COUNT(*) FROM radr_group_members WHERE group_id = g.id) as member_count,
              (SELECT COUNT(*) FROM radr_group_members WHERE group_id = g.id AND has_arrived = true) as arrived_count
       FROM radr_groups g
       JOIN radr_group_members m ON g.id = m.group_id
       WHERE m.user_id = $1 AND g.expires_at > NOW()
       ORDER BY g.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async inviteByUsername(groupId: string, username: string) {
    const userResult = await pool.query(
      `SELECT id FROM users WHERE username = $1`,
      [username]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error("User not found");
    }

    return await this.addMember(groupId, userResult.rows[0].id);
  },
};
