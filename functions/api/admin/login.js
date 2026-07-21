// Cloudflare Pages Function: /api/admin/login

export async function onRequestPost({ request, env }) {
  try {
    const { passcode } = await request.json();
    const expectedPasscode = env.ADMIN_PASSCODE || "meraj7782";

    if (passcode !== expectedPasscode) {
      return new Response(JSON.stringify({ error: "Invalid Admin Passcode" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Return token/auth status
    return new Response(JSON.stringify({
      authenticated: true,
      token: "admin_authenticated_session"
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
