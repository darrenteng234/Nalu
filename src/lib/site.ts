/** Site-wide config. Origin is env-driven so it works in dev/preview/prod. */
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "NALU"; // working master name; brand values remain unset
export function abs(path: string): string {
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
