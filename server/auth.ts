import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User, SafeUser } from "@shared/schema";

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

/* Simple in-memory token sessions. Token sent via Authorization: Bearer <token>
   header. The frontend keeps it in React state (no localStorage). */
const sessions = new Map<string, { userId: number; createdAt: number }>();

export function issueToken(userId: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId, createdAt: Date.now() });
  return token;
}

export function revokeToken(token: string) {
  sessions.delete(token);
}

export function getUserIdFromToken(token: string): number | undefined {
  return sessions.get(token)?.userId;
}

export function stripPassword(u: User): SafeUser {
  const { password, ...rest } = u;
  return rest;
}

export interface AuthedRequest extends Request {
  user?: User;
  userId?: number;
}

export async function authMiddleware(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice(7).trim();
    const userId = getUserIdFromToken(token);
    if (userId) {
      const user = await storage.getUser(userId);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: true, message: "Требуется авторизация" });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: true, message: "Требуется авторизация" });
    if (!roles.includes(req.user.roleCode)) {
      return res.status(403).json({ error: true, message: "У вас нет доступа к этому объекту" });
    }
    next();
  };
}

export function isPrivileged(user?: User) {
  return !!user && ["hr", "manager", "admin"].includes(user.roleCode);
}
