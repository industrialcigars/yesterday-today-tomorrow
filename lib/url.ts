// Railway's proxy forwards requests with a Host header of the internal
// hostname (e.g. localhost), not the public domain, so `request.url` can't
// be trusted to build absolute redirect URLs. Use APP_URL instead.
export function absoluteUrl(path: string): URL {
  const base = process.env.APP_URL || "http://localhost:3000";
  return new URL(path, base);
}
