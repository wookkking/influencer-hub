import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "remove_saved_influencer",
  title: "Remove from my list",
  description: "Remove an influencer from the signed-in user's campaign list.",
  inputSchema: {
    saved_id: z.string().describe("The saved_influencers row id from list_saved_influencers."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ saved_id }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { error } = await supabase.from("saved_influencers").delete().eq("id", saved_id);
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    return { content: [{ type: "text" as const, text: `Removed ${saved_id}` }] };
  },
});
