import type { User } from "../types/auth.types";

type JwtPayload = {
  [key: string]: unknown;
  email?: string;
  given_name?: string;
  name?: string;
  unique_name?: string;
  sub?: string;
  nameid?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
};

const decodeBase64Url = (value: string): string => {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(base64);
  }

  const maybeBuffer = (globalThis as Record<string, unknown>).Buffer as
    | { from: (input: string, encoding: string) => { toString: (encoding: string) => string } }
    | undefined;

  if (maybeBuffer) {
    return maybeBuffer.from(base64, "base64").toString("binary");
  }

  throw new Error("Base64 decoding is not supported in this environment");
};

const parseJwt = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }
    const decoded = decodeBase64Url(payload);
    const json = decodeURIComponent(
      decoded
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(json) as JwtPayload;
  } catch (error) {
    console.warn("Failed to decode JWT", error);
    return null;
  }
};

const getClaim = (payload: JwtPayload | null, keys: string[]): string => {
  if (!payload) {
    return "";
  }
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return "";
};

export const getUserFromToken = (token: string, fallback?: Partial<User>): User => {
  const payload = parseJwt(token);
  const id =
    getClaim(payload, [
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
      "nameid",
      "sub"
    ]) || fallback?.id || "";
  const email =
    getClaim(payload, [
      "email",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    ]) || fallback?.email || "";
  const userName =
    getClaim(payload, [
      "given_name",
      "name",
      "unique_name",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    ]) || fallback?.userName || "";

  return {
    id,
    email,
    userName
  };
};
