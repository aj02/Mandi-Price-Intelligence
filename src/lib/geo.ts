import { cookies, headers } from "next/headers";
import { INDIA_STATES, type IndianState } from "./constants";

// ISO 3166-2:IN subdivision codes → AGMARKNET state names (left as published).
// Source: https://en.wikipedia.org/wiki/ISO_3166-2:IN
const ISO_REGION_TO_STATE: Record<string, IndianState> = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CH: "Chandigarh",
  CT: "Chhattisgarh",
  CG: "Chhattisgarh",
  DN: "Dadra and Nagar Haveli and Daman and Diu",
  DD: "Dadra and Nagar Haveli and Daman and Diu",
  DH: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JK: "Jammu and Kashmir",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OD: "Odisha",
  OR: "Odisha",
  PY: "Puducherry",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TG: "Telangana",
  TS: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UT: "Uttarakhand",
  UK: "Uttarakhand",
  WB: "West Bengal",
};

export const STATE_COOKIE = "mm_state";

/** Look at the user's stored cookie first; fall back to Vercel geo headers. */
export async function detectUserState(): Promise<{
  state: IndianState | null;
  source: "cookie" | "geo" | "none";
}> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(STATE_COOKIE)?.value;
  if (stored) {
    const match = INDIA_STATES.find((s) => s === stored);
    if (match) return { state: match, source: "cookie" };
  }

  const hdrs = await headers();
  const country = hdrs.get("x-vercel-ip-country");
  const region = hdrs.get("x-vercel-ip-country-region");
  if (country === "IN" && region) {
    const mapped = ISO_REGION_TO_STATE[region.toUpperCase()];
    if (mapped) return { state: mapped, source: "geo" };
  }

  return { state: null, source: "none" };
}

export async function getStoredState(): Promise<IndianState | null> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(STATE_COOKIE)?.value;
  if (!stored) return null;
  return INDIA_STATES.find((s) => s === stored) ?? null;
}

export function isValidState(s: string): s is IndianState {
  return (INDIA_STATES as readonly string[]).includes(s);
}
