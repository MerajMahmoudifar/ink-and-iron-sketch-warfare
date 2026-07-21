// Cloudflare Pages Function: /api/admin/stats

function verifyAdminAuth(request, env) {
  const authHeader = request.headers.get("Authorization");
  const expectedPasscode = env.ADMIN_PASSCODE || "meraj7782";
  if (authHeader === `Bearer ${expectedPasscode}` || authHeader === "Bearer admin_authenticated_session") {
    return true;
  }
  return false;
}

export async function onRequestGet({ request, env }) {
  try {
    if (!verifyAdminAuth(request, env)) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const db = env.DB;
    
    // 1. Total users
    const totalUsersRes = await db.prepare("SELECT COUNT(*) as count FROM users").first();
    const totalUsers = totalUsersRes ? totalUsersRes.count : 0;

    // 2. Active last 24h
    const active24hRes = await db.prepare("SELECT COUNT(*) as count FROM users WHERE last_online >= datetime('now', '-24 hours')").first();
    const active24h = active24hRes ? active24hRes.count : 0;

    // 3. Online now (5 minutes)
    const onlineNowRes = await db.prepare("SELECT COUNT(*) as count FROM users WHERE last_online >= datetime('now', '-5 minutes')").first();
    const onlineNow = onlineNowRes ? onlineNowRes.count : 0;

    // 4. Total matches & wins sum
    const matchStatsRes = await db.prepare("SELECT SUM(wins) as total_wins, SUM(losses) as total_losses FROM users").first();
    const totalWins = matchStatsRes ? (matchStatsRes.total_wins || 0) : 0;
    const totalLosses = matchStatsRes ? (matchStatsRes.total_losses || 0) : 0;
    const totalMatches = Math.floor((totalWins + totalLosses) / 2) || (totalWins + totalLosses);

    return new Response(JSON.stringify({
      total_users: totalUsers,
      active_24h: active24h,
      online_now: onlineNow,
      total_matches: totalMatches,
      total_wins: totalWins,
      total_losses: totalLosses
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
