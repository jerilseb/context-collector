# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Context Collector is a Chrome/Edge browser extension that allows users to select content from web pages and collect it as clean Markdown. It operates in two modes:
- **Single Capture**: Immediately copy selected content to clipboard
- **Multi-page Collection**: Accumulate content from multiple pages/elements before copying

## Architecture

The extension follows Chrome Extension Manifest V3 architecture with these core components:

### Core Files
- `manifest.json` - Extension configuration with permissions and commands
- `background.js` - Service worker handling extension lifecycle and hotkey commands
- `content.js` - Content script injected into web pages for element selection and Markdown conversion
- `popup.js/popup.html` - Extension popup UI for start/stop controls
- `options.js/options.html` - Extension options page
- `notification.js` - Toast notification script

### Key Architecture Patterns

**Storage Management**: Uses `chrome.storage.local` API to persist state across tabs:
- `isCollecting`: Boolean flag for collection mode
- `collectedContent`: Accumulated Markdown content
- `isSingleCapture`: Boolean flag for single capture mode

**Content Script Injection**: 
- Background script injects `content.js` on hotkey press (Alt+Z)
- Content script activates element selection with visual hover effects
- Scripts are injected only when needed to minimize resource usage

**Markdown Conversion Engine**: 
- Sophisticated HTML-to-Markdown converter in `content.js:convertNodeToMarkdown()`
- Handles tables, code blocks, headings, lists, and preserves formatting
- Smart filtering of navigation elements, ads, and non-content elements
- Line number detection and removal from code blocks

**Restricted Page Handling**: 
- Both background and popup scripts check for restricted URLs (chrome://, edge://, etc.)
- Gracefully disables functionality on system pages

## Development Workflow

This is a vanilla JavaScript Chrome extension with no build process required.

### Testing the Extension
1. Load unpacked extension in Chrome: `chrome://extensions` → "Load unpacked" → select project folder
2. Test on various websites, avoiding restricted pages like `chrome://` URLs
3. Use developer tools to debug content script injection and Markdown conversion

### Key Development Areas
- Element selection logic is in `content.js:shouldIgnoreNode()` and hover handlers
- Markdown conversion rules are in `content.js:convertNodeToMarkdown()`
- UI state management is in `popup.js:updateUI()`
- Storage operations use async/await with `chrome.storage.local`

### Hotkey Configuration
Default hotkey is Alt+Z, configurable via `chrome://extensions/shortcuts`. The hotkey triggers content script injection only when collection mode is active.