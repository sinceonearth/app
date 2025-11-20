import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;

if (!JWT_SECRET) {
  throw new Error("❌ Missing JWT_SECRET or SESSION_SECRET in environment variables.");
}

export function createToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as jwt.Secret) as JwtPayload;
  } catch {
    return null;
  }
}
