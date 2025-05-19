# Context Collector - Project Overview

## Introduction

Context Collector is a browser extension that allows users to easily collect and extract specific content blocks from web pages and convert them to clean Markdown format. It's designed to streamline the process of gathering information from multiple sources for research, note-taking, content curation, and documentation.

## High-Level Architecture

The extension follows a standard browser extension architecture with the following components:

1. **Background Script**: Manages the extension's lifecycle and handles keyboard commands
2. **Content Script**: Injected into web pages to handle element selection and content extraction
3. **Popup UI**: Provides user controls for starting/stopping collection and accessing options
4. **Options Page**: Allows users to configure extension settings
5. **Storage**: Uses Chrome's storage API to persist collected content and settings

### Data Flow

1. User activates the extension via popup or keyboard shortcut
2. Content script is injected into the active tab
3. User selects elements on the page by hovering and clicking
4. Selected content is converted to Markdown and stored
5. User can collect from multiple pages in a session
6. When finished, all collected content is copied to clipboard

## Directory Structure

```
context-collector/
├── icons/                  # Extension icons in various sizes
│   ├── 16.png
│   ├── 32.png
│   ├── 48.png
│   ├── 64.png
│   ├── 128.png
│   └── 256.png
├── manifest.json           # Extension configuration
├── background.js           # Background service worker
├── content.js              # Content script for DOM interaction
├── notification.js         # Toast notification functionality
├── popup.html              # Extension popup UI
├── popup.js                # Popup functionality
├── options.html            # Settings page UI
├── options.css             # Settings page styling
├── options.js              # Settings page functionality
├── LICENSE                 # MIT license file
└── README.md               # Project documentation
```

## Features Overview

1. **Content Selection and Extraction**
   - Visual element selection with hover highlighting
   - Converts selected HTML elements to Markdown
   - Special handling for code blocks, tables, and other complex elements
   - Ignores ads and non-content elements

2. **Collection Management**
   - Multi-page collection in a single session
   - Single capture mode for one-time selections
   - Automatic content accumulation with separators
   - Session persistence using browser storage

3. **User Interface**
   - Simple popup with clear action buttons
   - Visual feedback with toast notifications
   - Dark-themed options page
   - Keyboard shortcut support

4. **Configuration Options**
   - Customizable keyboard shortcuts
   - Options page for settings management

## Technology Overview

- **Platform**: Chrome/Edge Extension (Manifest V3)
- **Languages**: 
  - JavaScript (ES6+) for extension logic
  - HTML/CSS for user interface
- **APIs Used**:
  - Chrome Extension APIs:
    - `chrome.storage` - For persisting collected content and settings
    - `chrome.scripting` - For injecting content scripts
    - `chrome.commands` - For handling keyboard shortcuts
    - `chrome.tabs` - For interacting with browser tabs
  - Web APIs:
    - DOM manipulation for element selection
    - Clipboard API for copying content
    - Storage API for persisting data

## Key Files and Their Roles

### `manifest.json`
The configuration file that defines the extension's metadata, permissions, and behavior. It specifies:
- Extension name, version, and icons
- Required permissions (activeTab, scripting, storage, commands)
- Background service worker
- Default popup
- Keyboard commands

### `background.js`
The background service worker that:
- Initializes storage on installation
- Handles keyboard commands
- Injects content scripts when triggered
- Prevents execution on restricted pages

### `content.js`
The core functionality script that:
- Implements element selection via hover and click
- Converts HTML elements to Markdown with specialized handling for:
  - Headings, paragraphs, lists
  - Code blocks with language detection
  - Tables with proper Markdown formatting
  - Inline formatting (bold, italic)
- Manages the selection UI (highlighting elements)
- Handles storage of collected content

### `popup.js` and `popup.html`
The extension's user interface that:
- Provides buttons for single capture or collection mode
- Shows collection status
- Handles copying collected content to clipboard
- Links to the options page

### `options.js`, `options.html`, and `options.css`
The settings interface that:
- Allows configuration of keyboard shortcuts
- Shows extension information
- Provides a dark-themed, modern UI

### `notification.js`
A utility script that:
- Creates toast notifications on the web page
- Provides visual feedback for user actions

## Development and Extension

The extension is designed with a modular structure that makes it easy to extend:

1. **Adding New Features**:
   - New conversion formats could be added by extending the conversion functions in `content.js`
   - Additional settings could be added to the options page
   - Export options could be expanded beyond clipboard copying

2. **Customization**:
   - The element selection logic can be modified to target different types of content
   - The Markdown conversion can be adjusted for different output formats
   - The UI can be styled differently by modifying the CSS

## Limitations

1. Cannot run on restricted browser pages (chrome://, edge://)
2. Performance may vary on complex or JavaScript-heavy pages
3. Markdown conversion might not perfectly capture every HTML structure

## Conclusion

Context Collector is a focused, utility-oriented browser extension that solves the specific problem of collecting and formatting content from multiple web pages. Its architecture follows standard browser extension patterns, with clear separation between background processes, content scripts, and user interface components.