// Cloudflare Pages Function: /api/user/sync

export async function onRequestPost({ request, env }) {
  try {
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: "Database binding missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.json();
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

    if (!id) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if user exists and if they are banned
    const existing = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();

    if (existing && existing.is_banned === 1) {
      return new Response(JSON.stringify({ error: "User profile is suspended", is_banned: true }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const cleanUsername = username || (existing ? existing.username : "Commander");
    const cleanEmail = email !== undefined ? email : (existing ? existing.email : "");
    const masterVol = typeof master_volume === "number" ? master_volume : (existing ? existing.master_volume : 80);
    const sfxVol = typeof sfx_volume === "number" ? sfx_volume : (existing ? existing.sfx_volume : 100);
    const muted = audio_muted ? 1 : 0;
    const planDur = typeof planning_duration === "number" ? planning_duration : (existing ? existing.planning_duration : 20);
    const playSpd = typeof playback_speed === "number" ? playback_speed : (existing ? existing.playback_speed : 3);
    const winCount = typeof wins === "number" ? wins : (existing ? existing.wins : 0);
    const lossCount = typeof losses === "number" ? losses : (existing ? existing.losses : 0);

    if (existing) {
      await db.prepare(`
        UPDATE users 
        SET username = ?, email = ?, master_volume = ?, sfx_volume = ?, audio_muted = ?, 
            planning_duration = ?, playback_speed = ?, wins = ?, losses = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(cleanUsername, cleanEmail, masterVol, sfxVol, muted, planDur, playSpd, winCount, lossCount, id).run();
    } else {
      await db.prepare(`
        INSERT INTO users (id, username, email, master_volume, sfx_volume, audio_muted, planning_duration, playback_speed, wins, losses)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, cleanUsername, cleanEmail, masterVol, sfxVol, muted, planDur, playSpd, winCount, lossCount).run();
    }

    const updatedUser = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();

    return new Response(JSON.stringify({ success: true, user: updatedUser }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
