Evarra Adaptive Workflows

Summary:
- This sample shows how Evarra supports different interaction styles within the same product.
- For goal creation, a user can choose between a guided workflow and a full form. The guided version presents one decision at a time, while the full version exposes the complete workflow for users who already understand what they want to do.
- The same preference model is used across other areas of the application so that different parts of the product remain consistent with the user’s selected experience.

Why I Built It This Way:
- Not every user needs the same level of guidance.
- A new user may benefit from being led through a process step by step, while an experienced user may find that same process unnecessarily restrictive. Rather than building separate products, I wanted both experiences to work from the same underlying functionality.
- The preferences are persisted differently depending on whether the user is signed in or using the application as a guest. For signed-in users, the interface updates immediately and rolls back if saving the preference fails.

Why I Selected This Sample:
- I selected this sample because it reflects how I think about user experience as part of the application architecture, not just the visual design.
- The goal was to reduce friction for different types of users while keeping the underlying product consistent and maintainable.
