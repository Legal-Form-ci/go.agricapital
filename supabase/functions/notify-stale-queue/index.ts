import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPPORT_EMAIL = "contact@agricapital.ci";
const STALE_HOURS_THRESHOLD = 48;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const {
      commercialId = "(non renseigné)",
      pendingCount = 0,
      oldestAgeHours = 0,
      userAgent = "",
      url = "",
    } = body as {
      commercialId?: string;
      pendingCount?: number;
      oldestAgeHours?: number;
      userAgent?: string;
      url?: string;
    };

    if (!pendingCount || oldestAgeHours < STALE_HOURS_THRESHOLD) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "below_threshold" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subject = `🔴 [AgriCapital] Retard sync ${oldestAgeHours}h — ${commercialId}`;
    const html = `
      <h2>Retard de synchronisation détecté</h2>
      <ul>
        <li><strong>Commercial :</strong> ${escapeHtml(commercialId)}</li>
        <li><strong>Inscriptions en attente :</strong> ${pendingCount}</li>
        <li><strong>Plus ancienne :</strong> ${oldestAgeHours} heures</li>
        <li><strong>Appareil :</strong> ${escapeHtml(userAgent)}</li>
        <li><strong>URL :</strong> ${escapeHtml(url)}</li>
        <li><strong>Heure :</strong> ${new Date().toISOString()}</li>
      </ul>
      <p>Contacter le commercial pour qu'il trouve une connexion réseau ou exporte le CSV via /admin.</p>
    `;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      // Pas encore configuré : on log seulement, l'appel reste OK pour ne pas bloquer le client.
      console.warn("[notify-stale-queue] RESEND_API_KEY missing — logging only", {
        commercialId, pendingCount, oldestAgeHours,
      });
      return new Response(
        JSON.stringify({ ok: true, sent: false, reason: "no_resend_key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AgriCapital Sync <onboarding@resend.dev>",
        to: [SUPPORT_EMAIL],
        subject,
        html,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("[notify-stale-queue] Resend error", data);
      return new Response(
        JSON.stringify({ ok: false, error: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true, sent: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-stale-queue] error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
