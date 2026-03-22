import type { Express, Response, Request, NextFunction } from "express";
import passport from "passport";
import { randomBytes } from "crypto";
import { authStorage } from "./storage";
import { hashPassword } from "./replitAuth";
import { isAuthenticated } from "./replitAuth";
import type { SessionUser } from "../../types";

export function registerAuthRoutes(app: Express): void {
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const existing = await authStorage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
      const hashed = await hashPassword(password);
      const user = await authStorage.createUser(username, hashed);
      // Auto-promote the site owner to admin on first registration
      const superAdmin = process.env.SUPER_ADMIN_USERNAME ?? "evanzellner";
      if (username.toLowerCase() === superAdmin.toLowerCase()) {
        await authStorage.setAdmin(user.id, true);
      }
      const sessionUser: SessionUser = { id: user.id, username: user.username };
      req.login(sessionUser, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        return res.json({ id: user.id, username: user.username });
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: SessionUser | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message ?? "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({ id: user.id, username: user.username });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
    const user = req.user as SessionUser;
    const full = await authStorage.getUserById(user.id);
    res.json({ id: user.id, username: user.username, isAdmin: full?.isAdmin ?? false });
  });

  // ── Admin routes ────────────────────────────────────────────────────────────
  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as SessionUser;
    const full = await authStorage.getUserById(user.id);
    if (!full?.isAdmin) return res.status(403).json({ message: "Forbidden" });
    next();
  };

  app.get("/api/admin/users", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const allUsers = await authStorage.getAllUsers();
      res.json(allUsers.map(u => ({ id: u.id, username: u.username, isAdmin: u.isAdmin })));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const self = req.user as SessionUser;
      if (req.params.id === self.id) return res.status(400).json({ message: "Cannot delete yourself" });
      await authStorage.deleteUser(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.patch("/api/admin/users/:id/admin", requireAdmin, async (req: Request, res: Response) => {
    try {
      const self = req.user as SessionUser;
      if (req.params.id === self.id) return res.status(400).json({ message: "Cannot change your own admin status" });
      const { isAdmin } = req.body;
      await authStorage.setAdmin(req.params.id, !!isAdmin);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      if (!username) return res.status(400).json({ message: "Username is required" });

      const user = await authStorage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "No account found with that username" });
      }

      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
      await authStorage.setResetToken(user.id, token, expires);

      return res.json({ token });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to generate reset token" });
    }
  });

  app.post("/api/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await authStorage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }
      if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
        return res.status(400).json({ message: "Reset link has expired. Please request a new one." });
      }

      const hashed = await hashPassword(newPassword);
      await authStorage.resetPassword(user.id, hashed);

      res.json({ ok: true });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
}
