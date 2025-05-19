# ✨ Context Collector ✨

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Effortlessly collect specific content blocks from multiple web pages and consolidate them into clean Markdown, ready for your clipboard.

<!-- Optional: Add a GIF/Screenshot here demonstrating the selection process -->
<!-- ![Context Collector Demo](link_to_your_gif_or_screenshot.gif) -->

Tired of messy copy-pasting? Need to grab multiple sections from different pages? Context Collector lets you precisely select elements and builds a clean Markdown collection for you.

## How it Works

1.  **Start Collecting:** Click the extension icon and press "Start Collecting". This activates the collection mode.
2.  **Activate Selection:** Navigate to a webpage and press the hotkey (`Alt+Z` by default).
3.  **Select Content:** Hover your mouse over the page – selectable content blocks will get a red outline. Click the block you want to add. A confirmation toast will appear.
4.  **Collect More:** Repeat steps 2 & 3 on the same or different pages to add more content to your collection. Each snippet includes its source URL.
5.  **Finish & Copy:** When done, click the extension icon again and press "Stop Collecting & Copy". All collected content (formatted as Markdown) is copied to your clipboard.

Press `Esc` anytime during the selection process (step 3) to cancel selecting from the current page.

## Key Features

*   **Multi-Select Accumulation:** Collect content from various elements across multiple pages.
*   **Visual Element Selection:** Easily identify and select content blocks with hover highlighting.
*   **Automatic Markdown Conversion:** Converts common HTML (headings, lists, code blocks, tables, bold/italics) to clean Markdown.
*   **Source Tracking:** Automatically adds the source URL for each collected snippet.
*   **Simple Controls:** Easy start/stop via the popup and hotkey activation.
*   **Clipboard Ready:** Copies the final compiled Markdown with one click.
*   **Configurable Hotkey:** Change the keyboard shortcut via Chrome's extension shortcuts page (chrome://extensions/shortcuts).

## Installation (Development/Testing)

1.  Download or clone this repository.
2.  Open Chrome/Edge and navigate to `chrome://extensions` or `edge://extensions`.
3.  Enable "Developer mode" (usually a toggle in the top right).
4.  Click "Load unpacked".
5.  Select the `context-collector` folder (the one containing `manifest.json`).
6.  The Context Collector icon ✨ will appear in your browser toolbar.

## Why Use Context Collector?

*   **Save Time:** Much faster than manual copy, paste, and reformat cycles.
*   **Clean Output:** Get structured, usable Markdown.
*   **Focused Collection:** Grab only what you need, ignoring ads and sidebars.
*   **Research & Note-Taking:** Perfect for gathering information from multiple sources.
*   **Content Curation:** Easily assemble snippets for blog posts or documentation.

## Limitations

*   Performance may vary on extremely complex or JavaScript-heavy pages.
*   Cannot run on restricted browser pages (e.g., `chrome://`, `edge://`) or the Chrome Web Store itself.
*   Markdown conversion is based on common HTML structures and might not perfectly capture every edge case.

## Contributing

Found a bug or have an idea? Feel free to open an issue or submit a pull request!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (You'll need to add a `LICENSE` file, typically containing the MIT license text).