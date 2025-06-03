# ✨ Context Collector ✨

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.1-green.svg)]

Effortlessly collect specific content blocks from multiple web pages and consolidate them into clean Markdown, ready for your clipboard.

<!-- Optional: Add a GIF/Screenshot here demonstrating the selection process -->
<!-- ![Context Collector Demo](link_to_your_gif_or_screenshot.gif) -->

Tired of messy copy-pasting? Need to grab multiple sections from different pages? Context Collector lets you precisely select elements and builds a clean Markdown collection for you.

## How it Works

Context Collector offers two main ways to capture content:

**1. Single Capture Mode (Quick Copy):**
    *   Click the extension icon and press "Single Capture".
    *   The selection mode activates immediately on the current page.
    *   Hover your mouse – selectable content blocks will get a red outline.
    *   Click the desired block. The converted Markdown is **instantly copied to your clipboard**.
    *   A confirmation toast will appear.

**2. Multi-Select Accumulation Mode:**
    *   **Start Collection:** Click the extension icon and press "Start Collecting". This activates collection mode.
    *   **Activate Selection on a Page:** Navigate to a webpage and press the hotkey (`Alt+Z` by default, configurable via `chrome://extensions/shortcuts`).
    *   **Select Content:** Hover to highlight (red outline) and click the block you want to add. A confirmation toast ("Content added to collection") will appear.
    *   **Collect More:** Repeat the "Activate Selection" and "Select Content" steps on the same or different pages to add more content.
    *   **Processing:** Selected content is added to a queue. If AI processing is enabled in Options, each snippet is processed in the background. The popup will show a "Processing items..." status.
    *   **Finish & Copy:** When done, click the extension icon again and press "Stop Collecting & Copy". All collected and processed content (formatted as Markdown) is copied to your clipboard.

**During Selection (Either Mode):**
*   Press `Esc` anytime to cancel the active selection process on the current page. A "Selection cancelled" toast will appear.
*   Configure AI processing (OpenAI/Gemini), API keys, and other preferences via the "Options" button in the popup.

## Key Features

*   **Multi-Select Accumulation:** Collect content from various elements across multiple pages and consolidate them.
*   **Single Capture Mode:** Instantly capture a single selected element directly to your clipboard.
*   **Visual Element Selection:** Easily identify and select content blocks with intuitive hover highlighting (red outline).
*   **Advanced Markdown Conversion:**
    *   Converts common HTML (headings, lists, bold/italics, blockquotes) to clean Markdown.
    *   Specialized conversion for tables.
    *   Intelligent code block conversion, including attempts at language detection and removal of line numbers.
*   **Optional AI-Powered Processing:**
    *   Leverage OpenAI (e.g., GPT models) or Google Gemini to automatically clean, refine, and improve the collected Markdown.
    *   Configurable API keys, model selection, custom system prompts, processing timeout, and maximum parallel requests via the Options page.
*   **Content Processing Queue:** Selected content items are queued and processed efficiently, with status updates in the popup.
*   **Smart Element Ignoring:** Intelligently skips common non-content elements like scripts, navigation bars, and advertisements based on tags, classes, or attributes.
*   **User-Friendly Controls & Feedback:**
    *   Simple start/stop collection and single capture via the extension popup.
    *   Hotkey (`Alt+Z` by default, configurable) to activate selection mode on any page.
    *   Press `Esc` to cancel the current selection process.
    *   Informative toast notifications for actions (e.g., "Content added," "Copied to clipboard," "Selection cancelled").
*   **Clipboard Ready:** Copies the final compiled and processed Markdown with one click from the popup.
*   **Options Page:** Access and configure AI processing settings, API keys, and other preferences.

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

*   **Page Complexity:** Performance of element selection may vary on extremely complex or JavaScript-heavy pages.
*   **Restricted Pages:** Cannot run on restricted browser pages (e.g., `chrome://`, `edge://` internal pages) or the Chrome Web Store itself due to browser security policies.
*   **Markdown Conversion:** While robust, automatic HTML-to-Markdown conversion might not perfectly capture every intricate HTML structure or styling nuance.
*   **AI Processing (If Enabled):**
    *   Requires valid API keys for OpenAI or Gemini, which you must obtain and configure in the Options page.
    *   An active internet connection is necessary for AI processing.
    *   Processing quality and cost depend on the chosen AI provider and model.
    *   AI processing introduces a delay as content is sent to and processed by the external API. The queue manager processes items in batches.
    *   AI models can sometimes be non-deterministic or produce unexpected results. The provided system prompt aims for clean output, but results can vary.
    *   Ensure compliance with the terms of service of your chosen AI provider.

## Contributing

Found a bug or have an idea? Feel free to open an issue or submit a pull request!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.