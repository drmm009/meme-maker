// Stable numeric order for mixed string ids ("imgflip-123", "giphy-abc", "custom-..."), shared by
// the home page and Explore. Trailing digits win; otherwise fall back to trendingScore so sort is
// deterministic (never NaN).
export function templateNumericId(t) {
  if (!t) return 0;
  const m = String(t.id || '').match(/(\d+)$/);
  if (m) return Number(m[1]);
  return t.trendingScore || 0;
}
