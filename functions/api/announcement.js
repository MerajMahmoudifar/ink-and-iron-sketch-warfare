// Cloudflare Pages Function: /api/announcement (Public)

export async function onRequestGet({ env }) {
  try {
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ announcement: null }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const current = await db.prepare("SELECT * FROM announcements WHERE active = 1 ORDER BY id DESC LIMIT 1").first();

    return new Response(JSON.stringify({ announcement: current || null }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ announcement: null }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
