// super-service — Supabase Edge Function entry point.
//
// Deployment requirements (per product spec — DO NOT change names):
//   - Function name: super-service
//   - Project ID: oldhxkiefqhnzullbyqk
//   - Verify JWT with legacy secret: OFF
//   - Public endpoint: https://oldhxkiefqhnzullbyqk.supabase.co/functions/v1/super-service
//
// Routes:
//   POST /            — run the pipeline. Body: AnalyzeRequest.
//                       Returns: AnalyzeResponse (needs_clarification | report).
//   GET  /health      — liveness probe.
//
// CORS is permissive — JWT is off, so all origin filtering happens here.

import { runPipeline } from "./pipeline.ts";
import type { AnalyzeRequest } from "./schema.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Max-Age": "86400"
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}

function error(message: string, status = 400, detail?: unknown): Response {
  return json({ error: message, detail }, status);
}

// deno-lint-ignore no-explicit-any
declare const Deno: any;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/+/, "").replace(/^functions\/v1\/super-service\/?/, "");

  if (req.method === "GET" && (path === "" || path === "health")) {
    return json({ ok: true, service: "super-service" });
  }

  if (req.method === "POST" && (path === "" || path === "analyze")) {
    let body: AnalyzeRequest;
    try {
      body = await req.json();
    } catch (_e) {
      return error("invalid JSON body");
    }

    if (!body || !Array.isArray(body.rows) || !body.context) {
      return error("missing rows or context");
    }

    try {
      const result = await runPipeline(body);
      return json(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return error("pipeline failure", 500, { message: msg });
    }
  }

  return error("not found", 404);
});
