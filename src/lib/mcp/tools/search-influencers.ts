import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_influencers",
  title: "Search influencers",
  description:
    "Search the shared influencer directory by keyword, platform, category and follower range.",
  inputSchema: {
    query: z.string().optional().describe("Keyword matched against account name and bio."),
    platform: z.string().optional().describe("Platform name, e.g. 인스타, 유튜브, 틱톡, 블로그."),
    category: z.string().optional().describe("Category tag, e.g. 뷰티, 패션, 푸드."),
    min_followers: z.number().optional(),
    max_followers: z.number().optional(),
    sort: z.enum(["followers", "recent"]).optional().describe("Default: followers."),
    limit: z.number().optional().describe("Max rows to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);

    let q = supabase
      .from("influencers")
      .select(
        "id, account, platform, followers, avg_likes, avg_views, avg_comments, engagement_rate, categories, bio, profile_url, last_post_date",
      );

    if (input.query) q = q.or(`account.ilike.%${input.query}%,bio.ilike.%${input.query}%`);
    if (input.platform) q = q.eq("platform", input.platform);
    if (input.category) q = q.contains("categories", [input.category]);
    if (typeof input.min_followers === "number") q = q.gte("followers", input.min_followers);
    if (typeof input.max_followers === "number") q = q.lte("followers", input.max_followers);
    q =
      input.sort === "recent"
        ? q.order("created_at", { ascending: false })
        : q.order("followers", { ascending: false });

    const { data, error } = await q.limit(limit);
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data ?? []) }],
      structuredContent: { influencers: data ?? [] },
    };
  },
});
