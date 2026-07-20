// Cloudflare Pages Function: /api/admin/users/[id]

function verifyAdminAuth(request, env) {
  const authHeader = request.headers.get("Authorization");
  const expectedPasscode = env.ADMIN_PASSCODE || "admin123";
  if (authHeader === `Bearer ${expectedPasscode}` || authHeader === "Bearer admin_authenticated_session") {
    return true;
  }
  return false;
}

// Update user (PUT)
export async function onRequestPut({ params, request, env }) {
  try {
    if (!verifyAdminAuth(request, env)) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { id } = params;
    const body = await request.json();
    const db = env.DB;

    const existing = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const username = body.username !== undefined ? body.username : existing.username;
    const masterVol = body.master_volume !== undefined ? Number(body.master_volume) : existing.master_volume;
    const sfxVol = body.sfx_volume !== undefined ? Number(body.sfx_volume) : existing.sfx_volume;
    const audioMuted = body.audio_muted !== undefined ? (body.audio_muted ? 1 : 0) : existing.audio_muted;
    const planDur = body.planning_duration !== undefined ? Number(body.planning_duration) : existing.planning_duration;
    const playSpd = body.playback_speed !== undefined ? Number(body.playback_speed) : existing.playback_speed;
    const wins = body.wins !== undefined ? Number(body.wins) : existing.wins;
    const losses = body.losses !== undefined ? Number(body.losses) : existing.losses;
    const isBanned = body.is_banned !== undefined ? (body.is_banned ? 1 : 0) : existing.is_banned;

    await db.prepare(`
      UPDATE users 
      SET username = ?, master_volume = ?, sfx_volume = ?, audio_muted = ?, 
          planning_duration = ?, playback_speed = ?, wins = ?, losses = ?, is_banned = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(username, masterVol, sfxVol, audioMuted, planDur, playSpd, wins, losses, isBanned, id).run();

    const updated = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();

    return new Response(JSON.stringify({ success: true, user: updated }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Delete user (DELETE)
export async function onRequestDelete({ params, request, env }) {
  try {
    if (!verifyAdminAuth(request, env)) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { id } = params;
    const db = env.DB;

    await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true, message: `User ${id} deleted` }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
