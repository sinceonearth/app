import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { createToken } from "./jwt";
import type { RequestWithUser } from "./routes"; // adjust path if needed
import { requireAuth } from "./routes"; // make sure this is exported from routes.ts

const router = Router();

/* ===============================
   🧾 REGISTER
   =============================== */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, country, inviteCode } = req.body as {
      name?: string;
      username?: string;
      email?: string;
      password?: string;
      country?: string | null;
      inviteCode?: string;
    };

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await storage.getUserByUsernameOrEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    let approved = false;
    let usedInviteCode = null;

    if (inviteCode) {
      const validCode = await storage.validateInviteCode(inviteCode);
      if (validCode) {
        approved = true;
        usedInviteCode = inviteCode;
      } else {
        return res.status(400).json({ message: "Invalid or expired invite code" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await storage.createUser({
      name,
      username,
      email,
      passwordHash,
      country: country || null,
      approved,
      inviteCodeUsed: usedInviteCode,
    });

    if (usedInviteCode) {
      await storage.markInviteCodeUsed(usedInviteCode, newUser.id);
    }

    if (!approved) {
      return res.status(201).json({
        message: "Registration successful. Your account is pending admin approval.",
        requiresApproval: true,
      });
    }

    const token = createToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      name: newUser.name,
      isAdmin: !!newUser.is_admin,
      alien: newUser.alien,
      country: newUser.country,
    });

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        country: newUser.country,
        alien: newUser.alien,
        is_admin: !!newUser.is_admin,
        approved: newUser.approved,
      },
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   🔐 LOGIN
   =============================== */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: "Email/username and password required" });
    }

    const user = await storage.getUserByUsernameOrEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.approved) {
      return res.status(403).json({ 
        message: "Your account is pending admin approval. Please check back later.",
        requiresApproval: true 
      });
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      isAdmin: !!user.is_admin,
      alien: user.alien,
      country: user.country,
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        country: user.country,
        alien: user.alien,
        is_admin: !!user.is_admin,
        approved: user.approved,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   🙋 GET AUTHENTICATED USER
   =============================== */
router.get("/user", requireAuth, async (req: RequestWithUser, res: Response) => {
  try {
    const tokenUser = req.user;
    if (!tokenUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch fresh user data from database
    const user = await storage.getUserById(tokenUser.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name ?? "",
      country: user.country ?? null,
      alien: user.alien,
      is_admin: user.is_admin ?? false,
      profile_icon: user.profile_icon ?? null,
      profile_color: user.profile_color ?? null,
      profile_setup_complete: user.profile_setup_complete ?? false,
    });
  } catch (err) {
    console.error("❌ Get user error:", err);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
});

/* ===============================
   📝 UPDATE USER PROFILE
   =============================== */
router.patch("/profile", requireAuth, async (req: RequestWithUser, res: Response) => {
  try {
    const { name, username, email, country } = req.body;
    const userId = req.user!.userId;

    if (!name || !username || !email) {
      return res.status(400).json({ message: "Name, username, and email are required" });
    }

    const existingUser = await storage.getUserByUsernameOrEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const existingUsername = await storage.getUserByUsernameOrEmail(username);
    if (existingUsername && existingUsername.id !== userId) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const updatedUser = await storage.updateUserProfile(userId, {
      name,
      username,
      email,
      country: country || "Other",
    });

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ Profile update error:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

/* ===============================
   🔑 CHANGE PASSWORD
   =============================== */
router.patch("/password", requireAuth, async (req: RequestWithUser, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const user = await storage.getUserById(userId);
    if (!user || !user.password_hash) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await storage.updateUserPassword(userId, newPasswordHash);

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("❌ Password change error:", err);
    return res.status(500).json({ message: "Failed to change password" });
  }
});

/* ===============================
   🗑️ DELETE ACCOUNT
   =============================== */
router.delete("/account", requireAuth, async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    await storage.deleteUser(userId);
    
    return res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("❌ Delete account error:", err);
    return res.status(500).json({ message: "Failed to delete account" });
  }
});

/* ===============================
   🎨 PROFILE SETUP
   =============================== */
router.post("/profile-setup", requireAuth, async (req: RequestWithUser, res: Response) => {
  try {
    const { profile_icon, profile_color } = req.body;
    const userId = req.user!.userId;

    if (!profile_icon || !profile_color) {
      return res.status(400).json({ message: "Icon and color are required" });
    }

    const updatedUser = await storage.updateProfileSetup(userId, {
      profile_icon,
      profile_color,
      profile_setup_complete: true,
    });

    return res.json({
      message: "Profile setup completed successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ Profile setup error:", err);
    return res.status(500).json({ message: "Failed to complete profile setup" });
  }
});

/* ===============================
   🎨 UPDATE PROFILE ICON
   =============================== */
router.patch("/profile-icon", requireAuth, async (req: RequestWithUser, res: Response) => {
  try {
    const { profile_icon } = req.body;
    const userId = req.user!.userId;

    if (!profile_icon) {
      return res.status(400).json({ message: "Icon is required" });
    }

    const updatedUser = await storage.updateProfileIcon(userId, profile_icon);

    return res.json({
      message: "Profile icon updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ Profile icon update error:", err);
    return res.status(500).json({ message: "Failed to update profile icon" });
  }
});

/* ===============================
   Default Export
=============================== */
export default router;
