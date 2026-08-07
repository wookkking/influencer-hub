import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/refresh-instagram")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { scrapeInstagramProfiles } = await import("@/lib/instagram.server");
        const { persistProfiles } = await import("@/lib/instagram-sync.server");

        const { data: rows, error } = await supabaseAdmin
          .from("influencers")
          .select("account")
          .eq("platform", "인스타")
          .order("last_synced_at", { ascending: true, nullsFirst: true })
          .limit(50);
        if (error) {
          console.error("refresh-instagram: load failed", error);
          return Response.json({ error: error.message }, { status: 500 });
        }

        const handles = (rows ?? []).map((r) => r.account as string).filter(Boolean);
        if (!handles.length) return Response.json({ refreshed: 0 });

        try {
          const profiles = await scrapeInstagramProfiles(handles);
          const results = await persistProfiles(supabaseAdmin, profiles, null);
          return Response.json({ refreshed: results.length });
        } catch (err) {
          console.error("refresh-instagram: sync failed", err);
          return Response.json({ error: String(err) }, { status: 502 });
        }
      },
    },
  },
});
