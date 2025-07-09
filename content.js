(function () {
  let hoveredElement = null;
  let isSelectionActive = true;

  const ignoredClasses = [
    'advertisement',
    'breadcrumb'
  ];

  const ignoredAttributes = [
    'role="navigation"',
    'id^="google_ads_iframe*'
  ];

  const ignoredTags = [
    'script',
    'noscript',
    'style',
    'svg',
    'button',
    'input',
    'label',
    'nav',
    'form',
    'audio',
    'video'
  ];

  // Remove toast if it's there
  document.getElementById("context-collector-toast")?.remove();

  let overlay = document.getElementById('context-collector-overlay');
  if (overlay === null) {
    overlay = document.createElement('div');
    overlay.id = 'context-collector-overlay';
    overlay.style.position = 'fixed';
    overlay.style.backgroundColor = 'rgba(3, 252, 123, 0.3)';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '99998';
    document.body.appendChild(overlay);
  }

  function showToast(message, duration = 1000) {
    const toast = document.createElement('div');
    toast.id = "context-collector-toast";
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
    toast.style.zIndex = '99999';
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

    // Ignore elements with specific attributes and their values
    if (ignoredAttributes.some(attr => node.matches(`[${attr}]`))) {
      return true;
    }

    // Ignore elements with display: none
    if (window.getComputedStyle(node)?.display === 'none') {
      return true;
    }

    return false;
  }

  // depending on the dom structure, textContent can miss line-breaks.
  // We prefer textContent, but fallback to innerText
  function getFormattedText(node) {
    let codeContent = node.textContent;
    const newLineIndex = codeContent.indexOf('\n');
    if (newLineIndex === -1 || newLineIndex > 100) {
      codeContent = node.innerText;
    }
    return codeContent.trim();
  }

  function convertTableToMarkdown(node) {
    let markdown = '\n';
    const rows = Array.from(node.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    const headerCells = Array.from(rows[0].querySelectorAll('th, td')); // Allow td in header too
    markdown += `| ${headerCells.map(cell => (cell.innerText || '').trim().replace(/\|/g, '\\|')).join(' | ')} |\n`;
    markdown += `| ${headerCells.map(() => '---').join(' | ')} |\n`;

    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll('td'));
      // Ensure the number of cells matches the header for basic markdown tables
      if (cells.length === headerCells.length) {
        markdown += `| ${cells.map(cell => (cell.innerText || '').trim().replace(/\|/g, '\\|')).join(' | ')} |\n`;
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

    // Try to detect language from class names (e.g., class="language-javascript")
    let language = '';
    const langClass = Array.from(node.classList).find(cls =>
      cls.startsWith('language-') || cls.startsWith('lang-')
    );
    if (langClass) {
      language = langClass.replace('language-', '').replace('lang-', '');
    }

    const codeContent = getFormattedText(clonedNode);
    return `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
  }

  function getHeadingText(node) {
    return node.textContent.replace('¶', '').trim();
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
        return `\n# ${getHeadingText(node)}\n\n`;
      case 'h2':
        return `\n## ${getHeadingText(node)}\n\n`;
      case 'h3':
        return `\n### ${getHeadingText(node)}\n\n`;
      case 'h4':
        return `\n#### ${getHeadingText(node)}\n\n`;
      case 'h5':
        return `\n##### ${getHeadingText(node)}\n\n`;
      case 'h6':
        return `\n###### ${getHeadingText(node)}\n\n`;
      case 'p':
        return `\n${children}\n\n`;
      case 'b':
      case 'strong':
        return ` **${children}** `;
      case 'i':
      case 'em':
        return ` *${children}* `;
      case 'a':
        let aPrefix = '';
        let aSuffix = '';
        if (node.nextSibling?.nodeType === Node.TEXT_NODE) {
          aSuffix = ' ';
        }
        if (node.previousSibling?.nodeType === Node.TEXT_NODE) {
          aPrefix = ' ';
        }
        return `${aPrefix}${children}${aSuffix}`;
      case 'img':
        return `\n`;
      case 'ul':
      case 'ol':
        return `\n${children}`;
      case 'li':
        const liText = children.trim();
        const parentList = node.closest('ul, ol');
        const hasNewline = liText.includes('\n');
        const liSuffix = hasNewline ? '\n\n' : '\n';

        if (parentList && parentList.tagName.toLowerCase() === 'ol') {
          const listItems = Array.from(parentList.children).filter(child => child.tagName.toLowerCase() === 'li');
          const itemIndex = listItems.indexOf(node);
          const startValue = parseInt(parentList.getAttribute('start') || '1', 10);
          const index = startValue + itemIndex;
          return `${index}. ${liText}${liSuffix}`;
        } else {
          return `- ${liText}${liSuffix}`;
        }
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
        // Most pre have a code inside them, defer to the code node
        if (node.querySelector('code') !== null) {
          return children;
        }
        // Some pages like Huggingface docs don't have a code within pre
        const classes = [...node.classList, ...node.parentNode.classList];
        if (classes.some(cls => cls.includes('code'))) {
          return convertCodeBlockToMarkdown(node);
        }
        return `\n---\n${getFormattedText(node)}\n---\n`;
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
      .replace(/^#{1,6}\s*$/gm, '')     // Remove blank headings (# ## ### etc. with only whitespace)
      .replace(/^[ \t]*-[ \t]*$/gm, '') // Remove lines that contain only a dash with spaces around it
      .replace(/\n{3,}/g, '\n\n')       // Replace 3 or more newlines with just 2
      .trim();                          // Remove leading/trailing spaces
  }

  async function handleElementClick(event) {
    if (!isSelectionActive) return; // Do nothing if the extension is inactive

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (!hoveredElement) return;

    console.log("Element clicked, converting to markdown...", hoveredElement);
    let markdown = '';
    try {
      const content = convertNodeToMarkdown(hoveredElement).trim();
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
        showToast('Content added to collection', 1500);
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
    if (!isSelectionActive) return;

    // const element = event.target.closest('*');
    const element = document.elementFromPoint(event.clientX, event.clientY);

    if (!element || element === hoveredElement) return;

    const rect = element.getBoundingClientRect();
    overlay.style.top = (rect.top) + 'px';
    overlay.style.left = (rect.left) + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    hoveredElement = element;
  }

  function handleEscapeKey(event) {
    if (isSelectionActive && event.key === 'Escape') {
      console.log('Escape key pressed, cancelling selection.');
      deactivateSelection();
      showToast('Selection cancelled', 1500);
    }
  }

  function handleScroll() {
    if (!hoveredElement) return;

    const rect = hoveredElement.getBoundingClientRect();
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
  }

  function deactivateSelection() {
    document.removeEventListener('click', handleElementClick, true);
    document.removeEventListener('mouseover', handleElementHover);
    document.removeEventListener('keydown', handleEscapeKey); // Remove escape listener
    window.removeEventListener('scroll', handleScroll)

    // Remove overlay
    overlay.style.width = 0;
    overlay.style.height = 0;

    hoveredElement = null;
    isSelectionActive = false;
  }

  async function activateSelection() {
    document.addEventListener('click', handleElementClick, true);
    document.addEventListener('mousemove', handleElementHover);
    document.addEventListener('keydown', handleEscapeKey); // Add escape listener
    window.addEventListener('scroll', handleScroll, true);

    isSelectionActive = true;
    // showToast('Select content to copy to clipboard', 1500);
  }

  // Initialize the extension selection mode when script is injected
  activateSelection();
})();
