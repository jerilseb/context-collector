(function () {
  let hoveredElement = null;
  let isSelectionActive = true;

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
    toast.style.fontSize = '14px';
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

  function findLineNumberContainer(codeEl) {
    /** Utility: does this element contain *only* whitespace-separated integers? */
    const digitsOnly = el => {
      // Drop leading / trailing space and collapse internal whitespace
      const tokens = el.textContent.trim().split(/\s+/);
      if (!tokens.length) return false;
      return tokens.every(tok => /^\d+$/.test(tok));
    };

    /* — 1) Fast path: look at direct children of <code> — */
    for (const child of codeEl.children) {
      if (digitsOnly(child)) return child;
    }

    /* — 2) General path: walk the subtree, stopping at the first numeric text-node — */
    const walker = document.createTreeWalker(
      codeEl,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: node => /^\d+$/.test(node.nodeValue.trim())
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      }
    );

    const firstNumeric = walker.nextNode();
    if (!firstNumeric) return null;         // no line-numbers at all

    // Climb up until: (a) parent is <code>  OR  (b) element’s children are all digits
    let el = firstNumeric.parentNode;
    while (el && el !== codeEl && !digitsOnly(el)) {
      el = el.parentNode;
    }
    return el === codeEl ? firstNumeric.parentNode : el;
  }

  function convertCodeBlockToMarkdown(node) {
    // Disabling cloning because innerText of clonedNode loses visual styles like line-breaks
    const clonedNode = node;
    // const clonedNode = node.cloneNode(true);

    // Remove line number elements before getting text content
    const lineNumberContainer = findLineNumberContainer(node);
    if (lineNumberContainer) {
      lineNumberContainer.remove();
    }

    // depending on the dom structure, textContent can miss line-breaks.
    // We prefer textContent, but fallback to innerText
    let codeContent = clonedNode.textContent;
    const newLineIndex = codeContent.indexOf('\n');
    if (newLineIndex === -1 || newLineIndex > 100) {
      codeContent = clonedNode.innerText;
    }

    // Try to detect language from class names (e.g., class="language-javascript")
    let language = '';
    const langClass = Array.from(node.classList).find(cls =>
      cls.startsWith('language-') || cls.startsWith('lang-')
    );
    if (langClass) {
      language = langClass.replace('language-', '').replace('lang-', '');
    }

    return `\`\`\`${language}\n${codeContent.trim()}\n\`\`\`\n\n`;
  }

  function convertNodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim();
    }

    if (shouldIgnoreNode(node)) {
      return '';
    }

    const tagName = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(convertNodeToMarkdown).join('').trim();

    switch (tagName) {
      case 'h1':
        return `\n# ${node.textContent.trim()}\n\n`;
      case 'h2':
        return `\n## ${node.textContent.trim()}\n\n`;
      case 'h3':
        return `\n### ${node.textContent.trim()}\n\n`;
      case 'h4':
        return `\n#### ${node.textContent.trim()}\n\n`;
      case 'h5':
        return `\n##### ${node.textContent.trim()}\n\n`;
      case 'h6':
        return `\n###### ${node.textContent.trim()}\n\n`;
      case 'p':
        return `\n${children}\n\n`;
      case 'b':
      case 'strong':
        return `**${children}**`;
      case 'i':
      case 'em':
        return `*${children}*`;
      case 'a':
        if (node.nextSibling?.nodeType === Node.TEXT_NODE || node.previousSibling?.nodeType === Node.TEXT_NODE) {
          return ` ${children} `;
        }
        return '';
      case 'img':
        return `\n`;
      case 'ul':
      case 'ol':
        return `${children}`;
      case 'li':
        if (children) {
          return `- ${children}\n`;
        }
        return '';
      case 'blockquote':
        return `> ${node.textContent}\n\n`;
      case 'code':
        // If it's inside a PRE, it's a code block
        if (node.closest('pre')) {
          return convertCodeBlockToMarkdown(node);
        }
        // inline code
        return ` \`${children}\` `;
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
        if (node.getAttribute('role') === 'code') {
          return convertCodeBlockToMarkdown(node);
        }
        if (node.firstElementChild?.tagName.toLowerCase() === 'div') {
          return children;
        }
        return `${children}\n`;
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
      let separator = '';
      if (currentContent) {
        separator = `\n\n-----------------\n\n`;
      }
      const updatedContent = currentContent + separator + newText;
      await chrome.storage.local.set({ collectedContent: updatedContent });
    } catch (error) {
      showToast('Failed to add content.', 1500);
    }
  }

  function handleElementHover(event) {
    if (!isSelectionActive) return; // Do nothing if the extension is inactive

    const element = event.target.closest('*');
    if (!element || element === hoveredElement) return;

    // Show outline on the hovered element
    if (hoveredElement) {
      hoveredElement.style.outline = '';
    }
    element.style.outline = '4px solid red';

    // // Create an overlay on the hovered element
    // document.getElementById('element-overlay')?.remove();
    // const rect = element.getBoundingClientRect();
    // const overlay = document.createElement('div');
    // overlay.id = 'element-overlay';
    // overlay.style.position = 'absolute';
    // overlay.style.top = (rect.top + window.scrollY) + 'px';
    // overlay.style.left = (rect.left + window.scrollX) + 'px';
    // overlay.style.width = rect.width + 'px';
    // overlay.style.height = rect.height + 'px';
    // overlay.style.backgroundColor = 'rgba(3, 252, 123, 0.3)';
    // overlay.style.pointerEvents = 'none';
    // overlay.style.zIndex = '9999';
    // document.body.appendChild(overlay);

    hoveredElement = element;
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

      // // Remove overlay
      // document.getElementById('element-overlay')?.remove();

      // Remove outline
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

    // // Remove overlay
    // document.getElementById('element-overlay')?.remove();

    // Remove outline
    if (hoveredElement) {
      hoveredElement.style.outline = '';
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
