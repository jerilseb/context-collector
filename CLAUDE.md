# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Context Collector is a Chrome/Edge browser extension that allows users to select and collect content from web pages, converting it to clean Markdown format. The extension operates in two modes:

- **Single Capture**: Click extension → "Single Capture" → select element → content copied to clipboard
- **Collection Mode**: Click extension → "Start Collecting" → use Alt+Z hotkey on pages → select multiple elements → "Stop Collecting & Copy" → all content copied as Markdown

## Architecture

### Core Components

- `manifest.json` - Extension configuration (Manifest V3)
- `background.js` - Service worker handling extension lifecycle and command routing
- `content.js` - Main content script for DOM interaction and Markdown conversion
- `popup.js` - Extension popup UI logic 
- `options.js` - Options page functionality
- `notification.js` - Toast notification helper

### Key Architecture Patterns

**Storage Management**: Uses Chrome's local storage API to persist:
- `isCollecting` - Whether collection mode is active
- `collectedContent` - Accumulated content string
- `isSingleCapture` - Flag for single capture mode

**Script Injection**: Background service worker injects content scripts dynamically based on user actions and keyboard commands.

**DOM Processing Pipeline**:
1. Element selection with visual feedback (red outline on hover)
2. DOM-to-Markdown conversion with specialized handlers for tables, code blocks, lists
3. Content sanitization and formatting
4. Storage or clipboard operations

### Markdown Conversion Engine

The `convertNodeToMarkdown()` function in `content.js` handles complex HTML-to-Markdown conversion including:

- **Code blocks**: Detects language classes, handles line number removal
- **Tables**: Converts to GitHub-flavored Markdown format
- **Lists**: Supports both ordered and unordered
- **Text formatting**: Bold, italic, links, blockquotes
- **Smart content filtering**: Ignores navigation, ads, scripts, hidden elements

## Development Commands

This is a vanilla JavaScript browser extension with no build system. Development workflow:

1. **Load Extension**: Chrome → `chrome://extensions` → Enable Developer Mode → "Load unpacked" → select project folder
2. **Test Changes**: Make code changes → Go to `chrome://extensions` → Click reload icon for Context Collector
3. **Debug**: Use browser DevTools → Extensions tab, or check Console in popup/content scripts

## Key Implementation Details

**Restricted Pages**: Extension cannot run on `chrome://`, `edge://`, `brave://`, or `chrome-extension://` URLs due to browser security policies.

**Content Selection**: Uses event delegation with `mouseover`/`mouseout` for element highlighting and `click` with capture phase for selection.

**Keyboard Shortcuts**: Alt+Z hotkey (configurable) triggers content selection when collection mode is active.

**Error Handling**: Graceful fallbacks for clipboard operations, storage access, and script injection failures.