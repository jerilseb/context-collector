(function () {
  let hoveredElement = null;
  let isSelectionActive = true;
  let isSingleCapture = false;

  const ignoredTags = ['script', 'style', 'svg', 'a'];
  const ignoredClasses = ['ad', 'ads', 'advertisement'];
  const ignoredAttributes = [];

  function showToast(message, duration = 1000) {
    const toast = document.createElement('div');
    toast.textContent = message;

    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(13, 119, 151)';
    toast.style.color = 'white';
    toast.style.padding = '15px 30px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '9999';
    toast.style.opacity = '1';
    toast.style.transition = 'opacity 0.5s ease-out';

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, duration);
  }

  function shouldIgnoreElement(node) {
    // Ignore specific tags
    if (ignoredTags.includes(node.tagName.toLowerCase())) {
      return true;
    }

    // Ignore elements with specific classes
    if (node.classList && Array.from(node.classList).some(cls => ignoredClasses.includes(cls))) {
      return true;
    }

    // Ignore elements with specific attributes
    if (ignoredAttributes.some(attr => node.hasAttribute(attr))) {
      return true;
    }

    return false;
  }

  function convertTableToMarkdown(tableElement) {
    let markdown = '\n';
    const rows = Array.from(tableElement.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    const headerCells = Array.from(rows[0].querySelectorAll('th, td')); // Allow td in header too
    markdown += `| ${headerCells.map(cell => (cell.textContent || '').trim().replace(/\|/g, '\\|')).join(' | ')} |\n`;
    markdown += `| ${headerCells.map(() => '---').join(' | ')} |\n`;

    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll('td'));
      // Ensure the number of cells matches the header for basic markdown tables
      if (cells.length === headerCells.length) {
        markdown += `| ${cells.map(cell => (cell.textContent || '').trim().replace(/\|/g, '\\|')).join(' | ')} |\n`;
      } else {
        // Handle rowspans/colspans crudely or skip row
        console.warn("Skipping table row with inconsistent cell count:", rows[i]);
      }
    }

    return markdown + '\n'; // Add newline after the table
  }

  function convertNodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim();
    }

    if (node.nodeType !== Node.ELEMENT_NODE || shouldIgnoreElement(node)) {
      return '';
    }

    const tagName = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(convertNodeToMarkdown).join('');

    switch (tagName) {
      case 'h1':
        return `# ${children}\n\n`;
      case 'h2':
        return `## ${children}\n\n`;
      case 'h3':
        return `### ${children}\n\n`;
      case 'h4':
        return `#### ${children}\n\n`;
      case 'h5':
        return `##### ${children}\n\n`;
      case 'h6':
        return `###### ${children}\n\n`;
      case 'p':
        return `\n${children}\n\n`;
      case 'b':
      case 'strong':
        return `**${children}**`;
      case 'i':
      case 'em':
        return `*${children}*`;
      case 'a':
        return `${children}`;
      case 'img':
        return `\n`;
      case 'ul':
        return `${children}`;
      case 'ol':
        return `${children}`;
      case 'li':
        const prefix = node.parentElement.tagName.toLowerCase() === 'ol' ? '1. ' : '- ';
        return `${prefix}${children}\n`;
      case 'blockquote':
        return `> ${children}\n\n`;
      case 'code':
        // Handle inline code
        // If it's inside a PRE, the PRE handler will take precedence
        if (node.closest('pre')) {
          // Remove line number elements before getting text content
          const clonedNode = node.cloneNode(true);
          const lineNumberElements = clonedNode.querySelectorAll('[class*="line-number"]');
          lineNumberElements.forEach(element => element.remove());

          const codeContent = clonedNode.textContent || '';

          // Try to detect language from class names (e.g., class="language-javascript")
          let language = '';
          const langClass = Array.from(node.classList).find(cls =>
            cls.startsWith('language-') || cls.startsWith('lang-')
          );
          if (langClass) {
            language = langClass.replace('language-', '').replace('lang-', '');
          }

          return `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
        }
        return `\`${children}\``;
      case 'hr':
        return `\n---\n\n`;
      case 'br':
        return '  \n'; // Markdown line break
      case 'table':
        return convertTableToMarkdown(node);
      case 'div':
        if (node.firstElementChild?.tagName.toLowerCase() === 'div') {
          return children;
        }
        return `${children}\n`;
      case 'span':
      case 'section':
      case 'article':
      case 'aside':
      case 'header':
      case 'footer':
      case 'nav':
      case 'pre':
        // Treat these mostly as containers, add space if they contain block-like children
        // or if they separate other block elements. This is complex.
        return children; // Pass content through mostly
      default:
        return children;
    }
  }

  function sanitizeFilename(title) {
    return title
      .replace(/[/\\:*?"<>|]/g, '_')    // Replace invalid characters
      .trim()                           // Remove leading/trailing spaces
      .replace(/\s+/g, '_')             // Replace spaces with underscores
      .substring(0, 100);               // Limit filename length
  }

  function sanitizeFileContent(content) {
    return content
      .replace(/^[ \t]+$/gm, '\n')      // Convert lines that contain only whitespace to a single newline
      .replace(/\n{3,}/g, '\n\n')       // Replace 3 or more newlines with just 2
      .trim();                          // Remove leading/trailing spaces
  }

  async function handleElementClick(event) {
    if (!isSelectionActive) return; // Do nothing if the extension is inactive

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const element = event.target.closest('*');
    if (!element) return;

    if (hoveredElement) {
      hoveredElement.style.outline = '';
    }

    console.log("Element clicked, scraping markdown...");
    const content = convertNodeToMarkdown(element).trim();
    const markdown = sanitizeFileContent(content);
    console.log("Markdown generated length:", markdown.length);

    deactivateSelection();

    // Check if we're in single capture mode
    try {
      const { isSingleCapture } = await chrome.storage.local.get('isSingleCapture');
      
      if (isSingleCapture) {
        // Single capture mode - copy directly to clipboard
        if (markdown) {
          await navigator.clipboard.writeText(markdown);
          showToast('Content copied to clipboard!', 1500);
          // Reset the single capture mode flag
          await chrome.storage.local.set({ isSingleCapture: false });
        } else {
          showToast('No content found in selected element.', 1500);
        }
      } else {
        // Regular collection mode - append to storage
        if (markdown) {
          await appendToStorage(markdown);
        } else {
          showToast('No content found in selected element.', 1500);
        }
      }
    } catch (error) {
      console.error("Error handling element click:", error);
      // Fall back to regular collection mode
      if (markdown) {
        await appendToStorage(markdown);
      } else {
        showToast('No content found in selected element.', 1500);
      }
    }
  }

  async function appendToStorage(newText) {
    try {
      const { collectedContent } = await chrome.storage.local.get('collectedContent');
      let currentContent = collectedContent || '';
      const separator = `\n\n----- Content from ${window.location.href} -----\n\n`;
      const updatedContent = currentContent + separator + newText;
      await chrome.storage.local.set({ collectedContent: updatedContent });
      showToast('Content added to collection', 1000);
    } catch (error) {
      showToast('Failed to add content.', 1500);
    }
  }

  function handleElementHover(event) {
    if (!isSelectionActive) return; // Do nothing if the extension is inactive

    const element = event.target.closest('*');
    if (element && element !== hoveredElement) {
      // Remove outline from previously hovered element
      if (hoveredElement) {
        hoveredElement.style.outline = '';
      }
      // Add outline to the currently hovered element
      element.style.outline = '2px solid red';
      hoveredElement = element;
    }
  }

  function handleEscapeKey(event) {
    if (isSelectionActive && event.key === 'Escape') {
      console.log('Escape key pressed, cancelling selection.');
      deactivateSelection();
      showToast('Selection cancelled', 1500);
    }
  }

  function handleElementHoverOut(event) {
    if (!isSelectionActive) return; // Do nothing if the extension is inactive

    const element = event.target.closest('*');
    if (element === hoveredElement) {
      // Remove outline when mouse leaves the element
      element.style.outline = '';
      hoveredElement = null;
    }
  }

  function deactivateSelection() {
    // Remove all event listeners
    document.removeEventListener('click', handleElementClick, true);
    document.removeEventListener('mouseover', handleElementHover);
    document.removeEventListener('mouseout', handleElementHoverOut);
    document.removeEventListener('keydown', handleEscapeKey); // Remove escape listener

    // Reset hovered element
    if (hoveredElement) {
      hoveredElement.style.outline = '';
      hoveredElement = null;
    }

    // Set extension as inactive
    isSelectionActive = false;
  }

  function activateSelection() {
    // Reattach event listeners
    document.addEventListener('click', handleElementClick, true);
    document.addEventListener('mouseover', handleElementHover);
    document.addEventListener('mouseout', handleElementHoverOut);
    document.addEventListener('keydown', handleEscapeKey); // Add escape listener
    // Set extension as active
    isSelectionActive = true;
  }

  // Check if we're in single capture mode
  async function checkSingleCaptureMode() {
    try {
      const { isSingleCapture: singleCaptureMode } = await chrome.storage.local.get('isSingleCapture');
      // Set the module-level variable
      isSingleCapture = !!singleCaptureMode;
      
      if (isSingleCapture) {
        // We're in single capture mode
        showToast('Select text to copy to clipboard', 1500);
      } else {
        showToast('Context Collector Active', 1500);
      }
    } catch (error) {
      console.error("Error checking single capture mode:", error);
      isSingleCapture = false;
      showToast('Context Collector Active', 1500);
    }
  }

  // Initialize the extension selection mode when script is injected
  activateSelection();
  checkSingleCaptureMode();
})();
