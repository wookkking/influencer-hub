import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/debug-photo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
        if (!expected || apikey !== expected) return new Response("Unauthorized", { status: 401 });

        const { account } = (await request.json()) as { account: string };
        const { scrapeInstagramProfiles } = await import("@/lib/instagram.server");
        const { cacheProfilePhoto } = await import("@/lib/instagram-photos.server");
        const profiles = await scrapeInstagramProfiles([account]);
        const p = profiles[0];
        if (!p) return Response.json({ found: false });
        const cached = await cacheProfilePhoto(p.account, p.photo_url);
        return Response.json({ found: true, photo_url: p.photo_url, cached });
      },
    },
  },
});
