import { createFileRoute } from "@tanstack/react-router";

/** 스토리지에 저장된 인플루언서 프로필 사진을 서빙한다. */
export const Route = createFileRoute("/api/public/influencer-photo/$key")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params.key;
        if (!/^[a-z0-9._-]+\.jpg$/i.test(key)) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("influencer-photos")
          .download(key);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "image/jpeg",
            "cache-control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
