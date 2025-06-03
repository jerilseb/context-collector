async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeoutMs}ms`);
        }
        throw error;
    }
}

async function processWithOpenAI(markdown, apiKey, model, timeout, systemPrompt) {
    if (!apiKey || !markdown.trim()) {
        return markdown;
    }

    const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{
                role: 'system',
                content: systemPrompt
            }, {
                role: 'user',
                content: markdown
            }],
        })
    }, timeout * 1000);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const processedContent = data.choices?.[0]?.message?.content;

    if (!processedContent) {
        throw new Error('No content received from OpenAI API');
    }

    return processedContent.trim();
}

async function processWithGemini(markdown, apiKey, model, timeout, systemPrompt) {
    if (!apiKey || !markdown.trim()) {
        return markdown;
    }

    const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{
                    text: systemPrompt
                }]
            },
            contents: [{
                parts: [{
                    text: markdown
                }]
            }]
        })
    }, timeout * 1000);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const processedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!processedContent) {
        throw new Error('No content received from Gemini API');
    }

    return processedContent.trim();
}

function isRestrictedPage(tab) {
  if (!tab?.url) {
    return false;
  }
  const restrictedProtocols = ['chrome://', 'edge://', 'brave://', 'chrome-extension://'];
  return restrictedProtocols.some(protocol => tab.url.startsWith(protocol));
}

export {
    processWithGemini,
    processWithOpenAI,
    isRestrictedPage
}