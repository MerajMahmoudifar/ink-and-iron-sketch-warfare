// Cloudflare Pages Functions Global Middleware: Error Handling & Typo Detection

const VALID_ENDPOINTS = [
  "/api/user/sync",
  "/api/announcement",
  "/api/admin/login",
  "/api/admin/stats",
  "/api/admin/announcement",
  "/api/admin/users"
];

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findBestMatchingEndpoint(path) {
  let bestMatch = null;
  let minDistance = Infinity;

  for (const validPath of VALID_ENDPOINTS) {
    const dist = levenshtein(path.toLowerCase(), validPath.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = validPath;
    }
  }

  // Only suggest if similarity distance is small enough (threshold)
  return minDistance <= 5 ? bestMatch : null;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Catch unmatched API requests starting with /api/
  try {
    const response = await context.next();

    if (response.status === 404 && url.pathname.startsWith('/api/')) {
      const suggested = findBestMatchingEndpoint(url.pathname);
      const payload = {
        status: 404,
        error: "Endpoint Not Found",
        requested_path: url.pathname,
        method: request.method,
        suggested_endpoint: suggested,
        message: suggested 
          ? `The endpoint '${url.pathname}' does not exist. Did you mean '${suggested}'?`
          : `The endpoint '${url.pathname}' does not exist on this server.`,
        remediation: suggested
          ? `Update your HTTP ${request.method} request URL to target '${suggested}'.`
          : `Check the Ink & Iron API manual for valid endpoints.`
      };

      return new Response(JSON.stringify(payload, null, 2), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return response;
  } catch (err) {
    // Top-level 500 handler for unexpected middleware or function runtime exceptions
    return new Response(JSON.stringify({
      status: 500,
      error: "Internal Server Execution Error",
      requested_path: url.pathname,
      message: err.message || "An unexpected error occurred while processing the request on the edge server.",
      remediation: "Check server logs or Cloudflare Pages Functions database bindings."
    }, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
