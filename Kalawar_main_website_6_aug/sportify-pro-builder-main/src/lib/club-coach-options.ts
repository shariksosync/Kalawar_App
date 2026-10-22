export const INDEPENDENT_CLUB = "Independent / No Affiliated Club";
export const INDEPENDENT_COACH = "Independent Athlete / No Coach";

export function formatClubOption(club: { name?: string; id?: string } | Record<string, any>): string {
  const name = String(club.name || "").trim();
  if (!name) return "";
  if (!club.id) return name;
  if (name.includes(`(${club.id})`)) return name;
  return `${name} (${club.id})`;
}

export function formatCoachOption(coach: { name?: string; id?: string } | Record<string, any>): string {
  const name = String(coach.name || "").trim();
  if (!name) return "";
  if (!coach.id) return name;
  if (name.includes(`(${coach.id})`)) return name;
  return `${name} (${coach.id})`;
}

/**
 * Format State Association option: e.g. "Santosh Kasbe ( Maharashtra )"
 */
export function formatStateAssociationOption(sa: { name?: string; state?: string; id?: string } | Record<string, any>): string {
  const name = String(sa.name || "").trim();
  const state = String(sa.state || "").trim();
  if (!name && !state) return "";
  if (name && state) return `${name} ( ${state} )`;
  return name || state;
}

/**
 * Format District Association option: e.g. "Sharik ( Kolhapur)"
 */
export function formatDistrictAssociationOption(da: { name?: string; district?: string; city?: string; state?: string; id?: string } | Record<string, any>): string {
  const name = String(da.name || "").trim();
  const dist = String(da.district || da.city || "").trim();
  if (!name && !dist) return "";
  if (name && dist) return `${name} ( ${dist} )`;
  return name || dist;
}

/**
 * Extracts pure state name from a formatted option string like "Santosh Kasbe ( Maharashtra )" -> "Maharashtra"
 */
export function extractStateFromOption(optionStr: string | undefined | null): string {
  if (!optionStr || !optionStr.trim()) return "";
  const trimmed = optionStr.trim();
  const match = trimmed.match(/\(\s*([^)]+?)\s*\)$/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}

/**
 * Extracts pure district name from a formatted option string like "Sharik ( Kolhapur)" -> "Kolhapur"
 */
export function extractDistrictFromOption(optionStr: string | undefined | null): string {
  if (!optionStr || !optionStr.trim()) return "";
  const trimmed = optionStr.trim();
  const match = trimmed.match(/\(\s*([^)]+?)\s*\)$/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}

/**
 * Returns list of approved state association dropdown options:
 * e.g. ["Santosh Kasbe ( Maharashtra )", ...]
 */
export function getApprovedStateAssociationDropdownOptions(
  registeredStateAssocs?: Array<{ name?: string; state?: string; status?: string; memberType?: string } | Record<string, any>>
): string[] {
  if (!Array.isArray(registeredStateAssocs) || registeredStateAssocs.length === 0) {
    return [];
  }
  const approved = registeredStateAssocs.filter(
    (sa) => sa.status === "Active" || sa.status === "Verified" || sa.status === "Affiliated" || !sa.status
  );
  const optionsSet = new Set<string>();
  for (const sa of approved) {
    const formatted = formatStateAssociationOption(sa);
    if (formatted) {
      optionsSet.add(formatted);
    }
  }
  return Array.from(optionsSet);
}

/**
 * Returns list of approved district association dropdown options for a given state:
 * e.g. ["Sharik ( Kolhapur)", ...]
 */
export function getApprovedDistrictAssociationDropdownOptions(
  registeredDistrictAssocs?: Array<{ name?: string; state?: string; district?: string; city?: string; status?: string; memberType?: string } | Record<string, any>>,
  selectedState?: string
): string[] {
  if (!Array.isArray(registeredDistrictAssocs) || registeredDistrictAssocs.length === 0) {
    return [];
  }
  const stateFilter = selectedState ? extractStateFromOption(selectedState).toLowerCase() : "";
  const approved = registeredDistrictAssocs.filter((da) => {
    const isApproved = da.status === "Active" || da.status === "Verified" || da.status === "Affiliated" || !da.status;
    if (!isApproved) return false;
    if (!stateFilter || stateFilter === "other") return true;
    const daState = String(da.state || "").trim().toLowerCase();
    return !daState || daState === "national" || daState === stateFilter;
  });
  const optionsSet = new Set<string>();
  for (const da of approved) {
    const formatted = formatDistrictAssociationOption(da);
    if (formatted) {
      optionsSet.add(formatted);
    }
  }
  return Array.from(optionsSet);
}

/**
 * Resolves a raw value (e.g. legacy name without ID or unformatted text) to a matching option in the dropdown list.
 */
export function resolveSelectedOption(val: string | undefined | null, options: string[], defaultFallback: string): string {
  if (!val || !val.trim()) return defaultFallback;
  const trimmed = val.trim();
  // Exact match
  if (options.includes(trimmed)) return trimmed;
  // Match by name without ID
  const matched = options.find((opt) => {
    if (opt.toLowerCase() === trimmed.toLowerCase()) return true;
    const withoutId = opt.replace(/\s*\([^)]*\)$/, "").trim();
    if (withoutId.toLowerCase() === trimmed.toLowerCase()) return true;
    return false;
  });
  if (matched) return matched;
  return trimmed;
}

/**
 * Returns structured club options for ONLY registered clubs in database/storage:
 * e.g. ["Independent / No Affiliated Club", "Titan Athletic Club (KSM-CL-2200)", ...]
 */
export function getClubDropdownOptions(
  registeredClubs?: Array<{ name?: string; id?: string; memberType?: string } | Record<string, any>>
): string[] {
  const optionsSet = new Set<string>();

  // Always include Independent as the default/unaffiliated option
  optionsSet.add(INDEPENDENT_CLUB);

  // Add ONLY the real registered clubs
  if (Array.isArray(registeredClubs) && registeredClubs.length > 0) {
    for (const club of registeredClubs) {
      if (club.name && String(club.name).trim()) {
        const formatted = formatClubOption(club);
        if (formatted) {
          optionsSet.add(formatted);
        }
      }
    }
  }

  return Array.from(optionsSet);
}

/**
 * Returns structured coach options for ONLY registered coaches in database/storage:
 * e.g. ["Independent Athlete / No Coach", "Coach David (KSM-CO-5120)", ...]
 */
export function getCoachDropdownOptions(
  registeredCoaches?: Array<{ name?: string; id?: string; memberType?: string } | Record<string, any>>
): string[] {
  const optionsSet = new Set<string>();

  // Always include Independent as the default/unassigned option
  optionsSet.add(INDEPENDENT_COACH);

  // Add ONLY the real registered coaches
  if (Array.isArray(registeredCoaches) && registeredCoaches.length > 0) {
    for (const coach of registeredCoaches) {
      if (coach.name && String(coach.name).trim()) {
        const formatted = formatCoachOption(coach);
        if (formatted) {
          optionsSet.add(formatted);
        }
      }
    }
  }

  return Array.from(optionsSet);
}
