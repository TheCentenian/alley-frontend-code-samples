Springmint Bonding Status

Summary:
- This sample shows how I transformed data from multiple sources into a single model that the frontend could use consistently.
- The application receives bonding-sale information from both saved registry data and a live public source. Those sources can sometimes disagree, so the code resolves them into one normalized status before the data reaches the interface.
- The resulting model provides the information the UI needs, including the current status, progress, display text, and formatted values. The same model supports both a compact list view and a more detailed view.

Why I Built It This Way:
- I wanted the component responsible for presentation to remain simple.
- Instead of asking the React component to understand every possible backend or blockchain state, the interpretation happens in a separate layer. The component receives a clean representation of what should be shown and focuses only on rendering it.
- The refresh logic also only polls states that can still change, while keeping existing data visible if a live refresh fails.

Why I Selected This Sample:
- I selected this sample because it shows how I separate application logic from presentation.
- Although the underlying data comes from a blockchain application, the frontend problem is more general: combine inconsistent data sources, normalize them into a predictable model, and keep the rendering layer simple and maintainable.
