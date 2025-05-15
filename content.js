(function () {
  let hoveredElement = null;
  let isSelectionActive = true;

  const ELEMENT_NODE = 1;
  const TEXT_NODE = 3;

  const ignoredClasses = ['ad', 'ads', 'advertisement'];
  const ignoredAttributes = [];
  const ignoredTags = [
    'script',
    'style',
    'svg',
    'button',
    'input',
    'label'
  ];

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

  function shouldIgnoreNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }

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

    // Ignore elements with display: none
    if (window.getComputedStyle(node)?.display === 'none') {
      return true;
    }

    return false;
  }

  function convertTableToMarkdown(node) {
    let markdown = '\n';
    const rows = Array.from(node.querySelectorAll('tr'));
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

  function convertCodeBlockToMarkdown(node) {
    // Disabling cloning because innerText of clonedNode loses visual styles like line-breaks
    const clonedNode = node;
    // const clonedNode = node.cloneNode(true);

    // Remove line number elements before getting text content
    const lineNumberElements = clonedNode.querySelectorAll('[class*="line-number"]');
    lineNumberElements.forEach(element => element.remove());

    // depending on the dom structure, textContent sometimes captures line-breaks.
    // If line-breaks are already captured by textContent, using innerText can add extra line-breaks
    let codeContent = clonedNode.textContent;
    if (!codeContent.includes('\n')) {
      codeContent = clonedNode.innerText;
    }

    if (!codeContent.endsWith('\n')) {
      codeContent += '\n';
    }

    // Try to detect language from class names (e.g., class="language-javascript")
    let language = '';
    const langClass = Array.from(node.classList).find(cls =>
      cls.startsWith('language-') || cls.startsWith('lang-')
    );
    if (langClass) {
      language = langClass.replace('language-', '').replace('lang-', '');
    }

    return `\`\`\`${language}\n${codeContent}\`\`\`\n\n`;
  }

  function convertNodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim();
    }

    if (shouldIgnoreNode(node)) {
      return '';
    }

    const tagName = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(convertNodeToMarkdown).join('');

    switch (tagName) {
      case 'h1':
        return `\n# ${node.textContent}\n\n`;
      case 'h2':
        return `\n## ${node.textContent}\n\n`;
      case 'h3':
        return `\n### ${node.textContent}\n\n`;
      case 'h4':
        return `\n#### ${node.textContent}\n\n`;
      case 'h5':
        return `\n##### ${node.textContent}\n\n`;
      case 'h6':
        return `\n###### ${node.textContent}\n\n`;
      case 'p':
        return `\n${children}\n\n`;
      case 'b':
      case 'strong':
        return `**${children}**`;
      case 'i':
      case 'em':
        return `*${children}*`;
      case 'a':
        if (node.nextSibling?.nodeType === TEXT_NODE || node.previousSibling?.nodeType === TEXT_NODE) {
          return ` ${children} `;
        }
        return '';
      case 'img':
        return `\n`;
      case 'ul':
      case 'ol':
        return `${children}`;
      case 'li':
        return `- ${children}\n`;
      case 'blockquote':
        return `> ${node.textContent}\n\n`;
      case 'code':
        // If it's inside a PRE, it's a code block
        if (node.closest('pre')) {
          return convertCodeBlockToMarkdown(node);
        }
        // inline code
        return `\`${children}\``;
      case 'pre':
        // Huggingface docs don't have a code within pre
        if (Array.from(node.parentNode.classList).some(cls => cls.includes('code'))) {
          return convertCodeBlockToMarkdown(node);
        }
        // Most pre have a code inside them, defer to the code node
        if (node.querySelector('code') !== null) {
          return children;
        }
        // Else just get the textContent, (do we innerText?)
        return `\n${node.textContent}\n`;
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
        return children;
      default:
        return children;
    }
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

    console.log("Element clicked, converting to markdown...", element);
    let markdown = '';
    try {
      const content = convertNodeToMarkdown(element).trim();
      markdown = sanitizeFileContent(content);
    }
    catch (error) {
      console.error(error);
    }
    deactivateSelection();

    if (markdown.length === 0) {
      showToast('No content found in selected element.', 1500);
      return;
    }

    // Check if we're in single capture mode
    try {
      const { isSingleCapture } = await chrome.storage.local.get('isSingleCapture');

      if (isSingleCapture) {
        await navigator.clipboard.writeText(markdown);
        showToast('Content copied to clipboard!', 1500);
        await chrome.storage.local.set({ isSingleCapture: false });
      } else {
        await appendToStorage(markdown);
        showToast('Content added to collection', 1000);
      }
    } catch (error) {
      console.error("Error handling element click:", error);
    }
  }

  async function appendToStorage(newText) {
    try {
      const { collectedContent } = await chrome.storage.local.get('collectedContent');
      let currentContent = collectedContent || '';
      const separator = `\n\n----- Content from ${window.location.href} -----\n\n`;
      const updatedContent = currentContent + separator + newText;
      await chrome.storage.local.set({ collectedContent: updatedContent });
    } catch (error) {
      showToast('Failed to add content.', 1500);
    }
  }

  function handleElementHover(event) {
    if (!isSelectionActive) return; // Do nothing if the extension is inactive

    const element = event.target.closest('*');
    if (element && element !== hoveredElement) {
      // Remove overlay from previously hovered element
      const existingOverlay = document.getElementById('element-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // Create and position overlay for the currently hovered element
      const rect = element.getBoundingClientRect();
      const overlay = document.createElement('div');
      overlay.id = 'element-overlay';

      // Use absolute positioning instead of fixed, relative to the document
      overlay.style.position = 'absolute';
      overlay.style.top = (rect.top + window.scrollY) + 'px';
      overlay.style.left = (rect.left + window.scrollX) + 'px';
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';
      overlay.style.backgroundColor = 'rgba(3, 252, 123, 0.3)';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '9999';

      document.body.appendChild(overlay);
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
      // Remove overlay when mouse leaves the element
      const existingOverlay = document.getElementById('element-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      hoveredElement = null;
    }
  }

  function deactivateSelection() {
    // Remove all event listeners
    document.removeEventListener('click', handleElementClick, true);
    document.removeEventListener('mouseover', handleElementHover);
    document.removeEventListener('mouseout', handleElementHoverOut);
    document.removeEventListener('keydown', handleEscapeKey); // Remove escape listener

    // Remove overlay if it exists
    const existingOverlay = document.getElementById('element-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Reset hovered element
    hoveredElement = null;

    // Set extension as inactive
    isSelectionActive = false;
  }

  async function activateSelection() {
    // Reattach event listeners
    document.addEventListener('click', handleElementClick, true);
    document.addEventListener('mouseover', handleElementHover);
    document.addEventListener('mouseout', handleElementHoverOut);
    document.addEventListener('keydown', handleEscapeKey); // Add escape listener
    isSelectionActive = true;

    showToast('Select content to copy to clipboard', 1500);
  }
  // Initialize the extension selection mode when script is injected
  activateSelection();
})();
