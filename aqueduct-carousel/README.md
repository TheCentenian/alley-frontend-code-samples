Aqueduct Module Carousel

Summary:
- This sample is a responsive carousel used to display product modules within the Aqueduct platform site.
- The component is built without a carousel library. CSS controls how the layout changes between narrow and wide screens, while JavaScript handles interaction and scroll behavior using native browser APIs.
- The component calculates the width of the active card, reads the live CSS gap, scrolls one card at a time, and updates the navigation controls based on the current scroll position. A resize observer keeps the controls accurate when the viewport changes.

Why I Built It This Way:
- I wanted the layout and the interaction logic to stay separate.
- CSS is responsible for where the controls appear and how the layout changes across screen sizes. JavaScript only handles the behavior that CSS cannot, such as calculating scroll distance and determining whether additional content is available in either direction.
- This keeps the component easier to understand and maintain while avoiding unnecessary screen-size logic in JavaScript.

Why I Selected This Sample:
- I selected this sample because it shows how I approach frontend behavior at the browser level rather than relying entirely on a framework or third-party component.
- It demonstrates how I work with responsive layout, DOM interaction, accessibility, and maintainable interface logic in a focused component.
