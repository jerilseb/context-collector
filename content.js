// Check if the current page is restricted
if (window.location.href.startsWith('chrome://') || window.location.href.startsWith('edge://')) {
  showToast('Extension cannot run on chrome:// or edge:// pages.');
} else {
  let hoveredElement = null;
  let isExtensionActive = true; // Track if the extension is active

  function showToast(message, duration = 1000) {
    const toast = document.createElement('div');
    toast.textContent = message;

    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(13, 119, 151, 0.9)';
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

  function scrapeToMarkdown(element) {
    // Helper function to check if an element should be ignored
    function shouldIgnoreElement(node) {
      const ignoredTags = ['script', 'style', 'svg'];
      const ignoredClasses = ['ad', 'ads', 'advertisement']; // Add more as needed
      const ignoredAttributes = ['onclick', 'onload']; // Add more as needed

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

    // Helper function to convert HTML elements to Markdown
    function convertToMarkdown(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.trim();
      }

      if (node.nodeType !== Node.ELEMENT_NODE || shouldIgnoreElement(node)) {
        return '';
      }

      const tagName = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map(convertToMarkdown).join('');

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
          return `${children}\n\n`;
        case 'b':
        case 'strong':
          return `**${children}**`;
        case 'i':
        case 'em':
          return `*${children}*`;
        case 'a':
          return `[${children}](${node.href})`;
        case 'img':
          return `![${node.alt || 'image'}](${node.src})`;
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
            return children; // Let PRE handle it
          }
          return `\`${children}\``;
        case 'pre':
          // Directly access textContent to preserve whitespace and newlines within the <pre> block.
          // Avoid recursively calling convertToMarkdown on children here.
          const codeContent = node.textContent || '';

          // Bonus: Try to detect language from class names (e.g., class="language-javascript")
          let language = '';
          const codeElement = node.querySelector('code'); // Often code is inside <pre><code>
          const targetElementForClass = codeElement || node; // Check <code> first, then <pre>
          const langClass = Array.from(targetElementForClass.classList).find(cls =>
            cls.startsWith('language-') || cls.startsWith('lang-')
          );
          if (langClass) {
            language = langClass.replace('language-', '').replace('lang-', '');
          }

          // Return standard Markdown fenced code block
          return `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
        case 'hr':
          return `\n---\n\n`;
        case 'br':
            return '  \n'; // Markdown line break
        case 'table':
          return convertTableToMarkdown(node);
        case 'div':
          case 'span':
          case 'section':
          case 'article':
          case 'aside':
          case 'header':
          case 'footer':
          case 'nav':
                // Treat these mostly as containers, add space if they contain block-like children
                // or if they separate other block elements. This is complex.
                return children; // Pass content through mostly
        default:
          return children;
      }
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

    // Convert the entire element to Markdown
    return convertToMarkdown(element).trim();
  }
  // Helper function to sanitize filenames
  function sanitizeFilename(title) {
    // Replace invalid characters with underscores
    return title
      .replace(/[/\\:*?"<>|]/g, '_') // Replace invalid characters
      .trim() // Remove leading/trailing spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit filename length
  }

  function handleElementClick(event) {
    if (!isExtensionActive) return; // Do nothing if the extension is inactive

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const element = event.target.closest('*');

    // Remove hover outline
    if (hoveredElement) {
      hoveredElement.style.outline = '';
    }

    // Visual feedback for click
    element.style.outline = '2px solid red';
    setTimeout(() => element.style.outline = '', 500);

    // Generate Markdown
    const markdown = scrapeToMarkdown(element);

    // Cleanup event listeners
    deactivateExtension();

    // Create a Blob and generate a URL
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    // Get the tab title
    chrome.runtime.sendMessage({ action: 'getTabTitle' }, (response) => {
      const tabTitle = response.tabTitle || 'content'; // Fallback to 'content' if title is unavailable
      const sanitizedTitle = sanitizeFilename(tabTitle); // Sanitize the title
      const filename = `${sanitizedTitle}.md`; // Add .md extension

      // Send the URL and filename to the background script
      // chrome.runtime.sendMessage({
      //   action: 'downloadMarkdown',
      //   url: url,
      //   filename: filename
      // });

      navigator.clipboard.writeText(markdown).then(() => {
        showToast('Content copied to clipboard');
      }).catch((err) => {
        console.error('Failed to copy content: ', err);
      });
    });
  }

  function handleElementHover(event) {
    if (!isExtensionActive) return; // Do nothing if the extension is inactive

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
    if (isExtensionActive && event.key === 'Escape') {
      console.log('Escape key pressed, cancelling selection.');
      deactivateExtension();
      showToast('Selection cancelled', 1500);
    }
  }

  function handleElementHoverOut(event) {
    if (!isExtensionActive) return; // Do nothing if the extension is inactive

    const element = event.target.closest('*');
    if (element === hoveredElement) {
      // Remove outline when mouse leaves the element
      element.style.outline = '';
      hoveredElement = null;
    }
  }

  function deactivateExtension() {
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
    isExtensionActive = false;
  }

  function activateExtension() {
    // Reattach event listeners
    document.addEventListener('click', handleElementClick, true);
    document.addEventListener('mouseover', handleElementHover);
    document.addEventListener('mouseout', handleElementHoverOut);
    document.addEventListener('keydown', handleEscapeKey); // Add escape listener
    // Set extension as active
    isExtensionActive = true;
  }

  // Initialize the extension
  activateExtension();
  showToast('Context Collector Active');
  // window.CONTEXT_COLLECTOR_INITIALIZED = true
}