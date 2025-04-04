# Webtext Chrome Extension

This Chrome extension allows users to select any DOM element on a webpage and scrape its text content, images, and video links into a Markdown file into an LLM friendly format. The downloaded file is named after the title of the current tab.

## Features
- **Select DOM Elements**: Click on any element to select it.
- **Visual Feedback**: Hover over elements to see a red outline; click to confirm selection.
- **Markdown Export**: Scrape text, images, and video links into a Markdown file.
- **Tab Title as Filename**: The downloaded file is named after the current tab's title.
- **Custom Alerts**: Notifies users when the extension cannot run on restricted pages (e.g., `chrome://` or `edge://`).

---

## Installation

### Step 1: Download the Extension
1. Clone or download this repository to your local machine.
2. Extract the files (if downloaded as a ZIP).

### Step 2: Load the Extension in Chrome/Edge
1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
2. Enable **Developer Mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the folder where the extension files are located.

### Step 3: Pin the Extension
1. Once loaded, click the **Extensions** icon in the toolbar.
2. Pin the **DOM Scraper to Markdown** extension for easy access.

---

## Usage

### Step 1: Activate the Extension
1. Navigate to any webpage where you want to scrape content.
2. Click the **DOM Scraper to Markdown** extension icon in the toolbar.

### Step 2: Select a DOM Element
1. Hover over elements on the page to see a red outline.
2. Click on the element you want to scrape.

### Step 3: Download the Markdown File
1. After clicking, the extension will:
   - Scrape the text, images, and video links from the selected element.
   - Generate a Markdown file named after the current tab's title.
   - Automatically download the file to your default downloads folder.

---

## Example

### Input: Webpage Content
```html
<div>
  <h1>Welcome to My Website</h1>
  <p>This is a <strong>sample</strong> paragraph with a <a href="https://example.com">link</a>.</p>
  <img src="image.png" alt="Sample Image">
</div>
```

### Output: Downloaded Markdown File (`Welcome_to_My_Website.md`)
```markdown
# Welcome to My Website

This is a **sample** paragraph with a [link](https://example.com).

![Sample Image](image.png)
```

---

## Troubleshooting

### 1. Extension Doesn't Work on Certain Pages
- The extension cannot run on restricted pages like `chrome://` or `edge://`.
- A custom alert will notify you if the extension is unable to run on the current page.

### 2. Invalid Filename Error
- If the tab title contains invalid characters, the extension will sanitize the filename automatically.
- Example: `My Document: A Study?` → `My_Document__A_Study_.md`

### 3. No Content Scraped
- Ensure you are selecting an element that contains visible content (e.g., text, images, or videos).
- Avoid selecting empty or non-content elements (e.g., `<div>` with no text).

---

## Customization

### Modify the Code
- Open the `content.js` file to customize:
  - **Markdown Formatting**: Update the `scrapeToMarkdown` function.
  - **Ignored Elements**: Modify the `shouldIgnoreElement` function to exclude specific tags, classes, or attributes.

### Add New Features
- Extend the functionality by adding support for additional HTML elements (e.g., tables, iframes).

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contributing
Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

---

## Feedback

If you have any feedback, suggestions, or questions, feel free to reach out to me on [Twitter](https://twitter.com/jit_infinity) or add an issue on [GitHub](https://github.com/prasanjit101/to-md)