import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";

const jwksUrl = process.env.SUPABASE_JWKS_URL;
const issuer = process.env.SUPABASE_URL
  ? `${process.env.SUPABASE_URL}/auth/v1`
  : undefined;

if (!jwksUrl) {
  throw new Error("SUPABASE_JWKS_URL is not set");
}

const jwks = createRemoteJWKSet(new URL(jwksUrl));

export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing access token" });
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: "authenticated",
    });

    req.user = payload;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
