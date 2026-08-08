import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_saved_influencer",
  title: "Update campaign status",
  description:
    "Update campaign progress fields on one of the signed-in user's saved influencers.",
  inputSchema: {
    saved_id: z.string().describe("The saved_influencers row id from list_saved_influencers."),
    contact_status: z.string().optional().describe("미컨택, 컨택완료, or 보류."),
    contact_date: z.string().optional().describe("YYYY-MM-DD."),
    reply_status: z.string().optional().describe("대기, 답변완료, or 거절."),
    terms_status: z.string().optional().describe("미정, 협의중, or 협의완료."),
    contract_sent: z.boolean().optional(),
    contract_returned: z.boolean().optional(),
    content_draft: z.boolean().optional(),
    upload_date: z.string().optional().describe("YYYY-MM-DD."),
    upload_link: z.string().optional(),
    views: z.number().optional(),
    result_likes: z.number().optional(),
    result_comments: z.number().optional(),
    memo: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ saved_id, ...patch }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
    const updates = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(updates).length === 0)
      return { content: [{ type: "text" as const, text: "No fields to update" }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("saved_influencers")
      .update(updates)
      .eq("id", saved_id)
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    if (!data)
      return { content: [{ type: "text" as const, text: "Saved influencer not found" }], isError: true };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: { saved: data },
    };
  },
});
