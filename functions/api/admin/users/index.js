// Cloudflare Pages Function: /api/admin/users

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
    const { results } = await db.prepare("SELECT * FROM users ORDER BY updated_at DESC").all();

    return new Response(JSON.stringify({ users: results || [] }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
