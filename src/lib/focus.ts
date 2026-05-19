import { INDIA_STATES, type IndianState } from "./constants";

/**
 * Single-state focus mode. When `FOCUS_STATE` env var is set to one of the
 * AGMARKNET state spellings, the app behaves as a dedicated dashboard for
 * that state:
 *   - ingest discards rows for other states before writing to Postgres,
 *   - queries auto-scope their `state =` predicates,
 *   - the header state picker is hidden,
 *   - /s/[state] for any other state returns 404.
 *
 * Leave unset for the full multi-state experience.
 */
const raw = process.env.FOCUS_STATE?.trim();
export const FOCUS_STATE: IndianState | null =
  raw && (INDIA_STATES as readonly string[]).includes(raw) ? (raw as IndianState) : null;

export const isFocused = (): boolean => FOCUS_STATE !== null;

export function assertNotForeignState(state: string): boolean {
  if (!FOCUS_STATE) return true;
  return state === FOCUS_STATE;
}
