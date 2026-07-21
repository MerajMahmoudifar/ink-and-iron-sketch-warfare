// Cloudflare Pages Function: /api/admin/announcement

function verifyAdminAuth(request, env) {
  const authHeader = request.headers.get("Authorization");
  const expectedPasscode = env.ADMIN_PASSCODE || "meraj7782";
  if (authHeader === `Bearer ${expectedPasscode}` || authHeader === "Bearer admin_authenticated_session") {
    return true;
  }
  return false;
}

export async function onRequestPost({ request, env }) {
  try {
    if (!verifyAdminAuth(request, env)) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { message, active } = await request.json();
    const db = env.DB;

    // Deactivate previous announcements
    await db.prepare("UPDATE announcements SET active = 0").run();

    if (active && message && message.trim()) {
      await db.prepare("INSERT INTO announcements (message, active) VALUES (?, 1)")
        .bind(message.trim())
        .run();
    }

    const current = await db.prepare("SELECT * FROM announcements WHERE active = 1 ORDER BY id DESC LIMIT 1").first();

    return new Response(JSON.stringify({ success: true, announcement: current || null }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
