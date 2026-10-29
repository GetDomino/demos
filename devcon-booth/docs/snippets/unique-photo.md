# Unique event photo

Participants upload a photo. Before any AI review, the quest checks whether another participant already submitted the same picture, even resized or re-encoded. Matches go to staff. Other photos are judged against your criteria; uncertain results go to staff.

1. Edit `quests/unique-photo.quest.ts` to set the quest key, instructions, photo criteria, point ledger and amount. Keep the key stable after the first deployment.
2. Ensure your participant app supports the `photo` interaction.
3. Run `domino check`, then `domino deploy --preview`, and deploy through your normal workflow.

**Similarity threshold.** The **Largest hash distance** setting, from 0 to 8, decides how close another participant's photo must be to count as reused. The default of 8 catches the same picture resized or re-encoded. Crops and added frames usually fall outside it.

Only photos checked by quests that call `ctx.images.seen` are recorded, within the same project and environment. A participant's own earlier attempts never count. Live verification needs Workers AI. See the [image checks guide](https://console.domino.run/docs/build/images).
