import { auth, defineMcp, type McpDefinitionInput } from "@lovable.dev/mcp-js";
import searchInfluencers from "./tools/search-influencers";
import listSavedInfluencers from "./tools/list-saved-influencers";
import saveInfluencer from "./tools/save-influencer";
import updateSavedInfluencer from "./tools/update-saved-influencer";
import removeSavedInfluencer from "./tools/remove-saved-influencer";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "influencer-hub",
  title: "Influencer Hub",
  version: "0.1.0",
  instructions:
    "Tools for the influencer discovery board. Use `search_influencers` to find accounts in the shared directory, `save_influencer` to add one to the signed-in user's campaign list, `list_saved_influencers` to review that list, and `update_saved_influencer` / `remove_saved_influencer` to manage campaign progress.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchInfluencers,
    listSavedInfluencers,
    saveInfluencer,
    updateSavedInfluencer,
    removeSavedInfluencer,
  ] as unknown as McpDefinitionInput["tools"],
});
