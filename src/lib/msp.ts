// Minimum Support Prices announced by Govt of India (CACP / agricoop.nic.in).
// Source: CACP price policy & DA&FW press releases.
// Update annually when new MSP announcements arrive.

export type MspEntry = {
  /** AGMARKNET commodity name (canonical key for joining). */
  commodity: string;
  variety?: string;
  season: string;
  /** Rupees per quintal. */
  price_per_quintal: number;
};

// Kharif 2025-26 (announced May/June 2025) — source: PIB release on CCEA-approved MSPs.
export const MSP_KHARIF_2025_26: MspEntry[] = [
  { commodity: "Paddy", variety: "Common", season: "Kharif 2025-26", price_per_quintal: 2369 },
  { commodity: "Paddy", variety: "Grade A", season: "Kharif 2025-26", price_per_quintal: 2389 },
  { commodity: "Jowar", variety: "Hybrid", season: "Kharif 2025-26", price_per_quintal: 3699 },
  { commodity: "Jowar", variety: "Maldandi", season: "Kharif 2025-26", price_per_quintal: 3749 },
  { commodity: "Bajra", season: "Kharif 2025-26", price_per_quintal: 2775 },
  { commodity: "Ragi", season: "Kharif 2025-26", price_per_quintal: 4886 },
  { commodity: "Maize", season: "Kharif 2025-26", price_per_quintal: 2400 },
  { commodity: "Arhar", season: "Kharif 2025-26", price_per_quintal: 8000 },
  { commodity: "Moong", season: "Kharif 2025-26", price_per_quintal: 8768 },
  { commodity: "Urad", season: "Kharif 2025-26", price_per_quintal: 7800 },
  { commodity: "Groundnut", season: "Kharif 2025-26", price_per_quintal: 7263 },
  { commodity: "Sunflower", season: "Kharif 2025-26", price_per_quintal: 7721 },
  { commodity: "Soyabean", variety: "Yellow", season: "Kharif 2025-26", price_per_quintal: 5328 },
  { commodity: "Sesamum", season: "Kharif 2025-26", price_per_quintal: 9846 },
  { commodity: "Nigerseed", season: "Kharif 2025-26", price_per_quintal: 9537 },
  { commodity: "Cotton", variety: "Medium Staple", season: "Kharif 2025-26", price_per_quintal: 7710 },
  { commodity: "Cotton", variety: "Long Staple", season: "Kharif 2025-26", price_per_quintal: 8110 },
];

// Rabi 2025-26 (announced Oct 2024) — for crops harvested in 2025-26 marketing year.
export const MSP_RABI_2025_26: MspEntry[] = [
  { commodity: "Wheat", season: "Rabi 2025-26", price_per_quintal: 2425 },
  { commodity: "Barley", season: "Rabi 2025-26", price_per_quintal: 1980 },
  { commodity: "Gram", season: "Rabi 2025-26", price_per_quintal: 5650 },
  { commodity: "Masur", season: "Rabi 2025-26", price_per_quintal: 6700 },
  { commodity: "Rapeseed & Mustard", season: "Rabi 2025-26", price_per_quintal: 5950 },
  { commodity: "Safflower", season: "Rabi 2025-26", price_per_quintal: 5940 },
];

export const ALL_MSP: MspEntry[] = [...MSP_KHARIF_2025_26, ...MSP_RABI_2025_26];

/** Loose lookup against AGMARKNET commodity strings. */
export function findMsp(commodity: string, variety?: string | null): MspEntry | null {
  const c = commodity.trim().toLowerCase();
  const v = (variety ?? "").trim().toLowerCase();

  let candidates = ALL_MSP.filter(
    (m) => m.commodity.toLowerCase() === c || c.startsWith(m.commodity.toLowerCase()),
  );
  if (!candidates.length) {
    candidates = ALL_MSP.filter((m) => c.includes(m.commodity.toLowerCase()));
  }
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];

  const withVariety = candidates.find(
    (m) => m.variety && (v.includes(m.variety.toLowerCase()) || m.variety.toLowerCase().includes(v)),
  );
  return withVariety || candidates.find((m) => !m.variety) || candidates[0];
}

export const MSP_COMMODITIES = Array.from(new Set(ALL_MSP.map((m) => m.commodity)));
