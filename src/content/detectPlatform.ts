import type { Platform } from "../types";

export function detectPlatform(): Platform {
  const host = location.hostname.toLowerCase();
  if (host.includes("linkedin")) return "linkedin";
  if (host.includes("wellfound") || host.includes("angel.co"))
    return "wellfound";
  if (host.includes("bdjobs")) return "bdjobs";
  if (host.includes("indeed")) return "indeed";
  if (host.includes("glassdoor")) return "glassdoor";
  return "generic";
}
