import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_saved_influencers",
  title: "List my campaign list",
  description:
    "List the signed-in user's saved influencers with campaign status (contact, reply, contract, upload results).",
  inputSchema: {
    contact_status: z.string().optional().describe("Filter by contact status, e.g. 미컨택, 컨택완료, 보류."),
    limit: z.number().optional().describe("Max rows to return (default 50, max 200)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);

    let q = supabase
      .from("saved_influencers")
      .select("*, influencer:influencers(id, account, platform, followers, categories, profile_url)")
      .order("created_at", { ascending: false });
    if (input.contact_status) q = q.eq("contact_status", input.contact_status);

    const { data, error } = await q.limit(limit);
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data ?? []) }],
      structuredContent: { saved: data ?? [] },
    };
  },
});
