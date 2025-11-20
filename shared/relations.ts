import { relations } from "drizzle-orm";
import { radrGroups, radrGroupMembers, radrMessages, users } from "./schema";

/* =======================================================
   📡 Radr Groups Relations
   ======================================================= */
export const radrGroupsRelations = relations(radrGroups, ({ many }) => ({
  members: many(radrGroupMembers),
  messages: many(radrMessages),
}));

/* =======================================================
   📌 Radr Group Members Relations
   ======================================================= */
export const radrGroupMembersRelations = relations(radrGroupMembers, ({ one }) => ({
  group: one(radrGroups, {
    fields: [radrGroupMembers.group_id],
    references: [radrGroups.id],
  }),
  user: one(users, {
    fields: [radrGroupMembers.user_id],
    references: [users.id],
  }),
}));

/* =======================================================
   💬 Radr Messages Relations
   ======================================================= */
export const radrMessagesRelations = relations(radrMessages, ({ one }) => ({
  group: one(radrGroups, {
    fields: [radrMessages.group_id],
    references: [radrGroups.id],
  }),
  user: one(users, {
    fields: [radrMessages.user_id],
    references: [users.id],
  }),
}));
