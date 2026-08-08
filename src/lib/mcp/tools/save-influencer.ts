import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "save_influencer",
  title: "Save influencer to my list",
  description: "Add a directory influencer to the signed-in user's campaign list.",
  inputSchema: {
    influencer_id: z.string().describe("The influencer id returned by search_influencers."),
    memo: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ influencer_id, memo }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("saved_influencers")
      .insert({ influencer_id, user_id: ctx.getUserId(), ...(memo ? { memo } : {}) })
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: { saved: data },
    };
  },
});
