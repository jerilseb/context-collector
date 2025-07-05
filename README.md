# Context Collector

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This extension lets you collect specific content blocks from web pages and consolidate them into clean Markdown, ready for your clipboard. Choose between **single capture** mode for quick one-time selections or **collection** mode for gathering content from multiple pages.

[demo.webm](https://github.com/user-attachments/assets/5e12a638-a485-4cf9-83e8-0eac9bfc1a7f)

## Limitations

 - Markdown conversion is based on common HTML structures and might not perfectly capture every edge case.
 - The primary intent of the tool is to capture text based content. It ignores images, video, iframes etc.

## How it Works

### Single Capture Mode
- Click the extension icon and press "Single Capture"
- Hover your mouse over the page – selectable content blocks will get a red outline
- Click the block you want to capture. The content is immediately copied to your clipboard as Markdown

### Collection Mode
1.  **Start Collecting:** Click the extension icon and press "Start Collecting". This activates the collection mode.
2.  **Activate Selection:** Navigate to a webpage and press the hotkey (`Alt+X` by default).
3.  **Select Content:** Hover your mouse over the page – selectable content blocks will get a red outline. Click the block you want to add. A confirmation toast will appear.
4.  **Collect More:** Repeat steps 2 & 3 on the same or different pages to add more content to your collection. Each snippet includes its source URL.
5.  **Finish & Copy:** When done, click the extension icon again and press "Stop Collecting & Copy". All collected content (formatted as Markdown) is copied to your clipboard.

Press `Esc` anytime during the selection process to cancel selecting from the current page.


## Installation

1.  Download or clone this repository.
2.  Open Chrome/Edge and navigate to `chrome://extensions` or `edge://extensions`.
3.  Enable "Developer mode" (usually a toggle in the top right).
4.  Click "Load unpacked".
5.  Select the `context-collector` folder (the one containing `manifest.json`).
6.  The Context Collector icon ✨ will appear in your browser toolbar.


## Contributing

Found a bug or have an idea? Feel free to open an issue or submit a pull request!

## License

This project is licensed under the MIT License
