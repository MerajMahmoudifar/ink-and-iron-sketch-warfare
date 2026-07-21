// Cloudflare Pages Function: /api/user/sync

export async function onRequestPost({ request, env }) {
  try {
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({
        status: 500,
        error: "Database Binding Missing",
        message: "The serverless function could not connect to Cloudflare D1.",
        remediation: "Verify Wrangler wrangler.jsonc contains d1_databases binding 'DB'."
      }, null, 2), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({
        status: 400,
        error: "Malformed JSON Payload",
        message: "The request body could not be parsed as valid JSON.",
        remediation: "Ensure Content-Type is 'application/json' and request body contains valid JSON syntax."
      }, null, 2), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const {
      id,
      username,
      email,
      master_volume,
      sfx_volume,
      audio_muted,
      planning_duration,
      playback_speed,
      wins,
      losses
    } = body;

    if (!id || typeof id !== "string" || !id.trim()) {
      return new Response(JSON.stringify({
        status: 400,
        error: "Missing Required Field",
        message: "Field 'id' is required and must be a non-empty string.",
        remediation: "Pass a valid user ID (e.g. Firebase UID 'wZJGUsCzK...' or handle 'usr_abc123') in the JSON body."
      }, null, 2), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if user exists and if they are banned
    const existing = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id.trim()).first();

    if (existing && existing.is_banned === 1) {
      return new Response(JSON.stringify({
        status: 403,
        error: "User Profile Suspended",
        is_banned: true,
        message: `Commander account '${id}' has been suspended by an Administrator.`,
        remediation: "Account access is locked. Contact an administrator to request unbanning."
      }, null, 2), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const cleanUsername = username || (existing ? existing.username : "Commander");
    const cleanEmail = email !== undefined ? email : (existing ? existing.email : "");
    const masterVol = typeof master_volume === "number" ? Math.max(0, Math.min(100, master_volume)) : (existing ? existing.master_volume : 80);
    const sfxVol = typeof sfx_volume === "number" ? Math.max(0, Math.min(100, sfx_volume)) : (existing ? existing.sfx_volume : 100);
    const muted = audio_muted ? 1 : 0;
    const planDur = typeof planning_duration === "number" ? Math.max(5, Math.min(60, planning_duration)) : (existing ? existing.planning_duration : 20);
    const playSpd = typeof playback_speed === "number" ? Math.max(1, Math.min(10, playback_speed)) : (existing ? existing.playback_speed : 3);
    const winCount = typeof wins === "number" ? Math.max(0, wins) : (existing ? existing.wins : 0);
    const lossCount = typeof losses === "number" ? Math.max(0, losses) : (existing ? existing.losses : 0);

    if (existing) {
      await db.prepare(`
        UPDATE users 
        SET username = ?, email = ?, master_volume = ?, sfx_volume = ?, audio_muted = ?, 
            planning_duration = ?, playback_speed = ?, wins = ?, losses = ?, 
            last_online = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(cleanUsername, cleanEmail, masterVol, sfxVol, muted, planDur, playSpd, winCount, lossCount, id.trim()).run();
    } else {
      await db.prepare(`
        INSERT INTO users (id, username, email, master_volume, sfx_volume, audio_muted, planning_duration, playback_speed, wins, losses, last_online)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(id.trim(), cleanUsername, cleanEmail, masterVol, sfxVol, muted, planDur, playSpd, winCount, lossCount).run();
    }

    const updatedUser = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id.trim()).first();

    return new Response(JSON.stringify({ success: true, user: updatedUser }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      status: 500,
      error: "Sync Execution Error",
      message: err.message || "Database synchronization failed.",
      remediation: "Verify SQL query structure and D1 database connection."
    }, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
