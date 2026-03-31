import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ADMIN_EMAIL = "contact@agricapital.ci";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nom, zone, email, whatsapp } = await req.json();

    // Send notification email via Supabase's built-in email (or log for now)
    console.log(`New waitlist signup: ${nom} (${email}) from ${zone}, WhatsApp: ${whatsapp}`);

    // For now, we log the notification. To send actual emails, 
    // configure an email service (Resend, SendGrid, etc.)
    return new Response(
      JSON.stringify({ success: true, message: "Notification logged" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
