async function withTimeout(promise, ms, timeoutError = new Error('Operation timed out')) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(timeoutError);
        }, ms);
    });

    try {
        return await Promise.race([
            promise,
            timeoutPromise
        ]);
    } finally {
        clearTimeout(timeoutId);
    }
}


async function processWithOpenAI(markdown, apiKey, model, systemPrompt) {
    if (!apiKey || !markdown.trim()) {
        return markdown;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const processedContent = data.choices?.[0]?.message?.content;

    if (!processedContent) {
        throw new Error('No content received from Gemini API');
    }

    return processedContent.trim();
}

async function processWithGemini(markdown, apiKey, model, systemPrompt) {
    if (!apiKey || !markdown.trim()) {
        return markdown;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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
    });

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

async function callAIProvider(markdown, providerName, openaiApiKey, openaiModel, geminiApiKey, geminiModel, fetchTimeout, systemPrompt) {
    let finalContent = markdown;
    try {
        if (providerName === 'openai' && openaiApiKey) {
            console.log("Processing item with OpenAI...");
            finalContent = await withTimeout(processWithOpenAI(markdown, openaiApiKey, openaiModel, systemPrompt), fetchTimeout * 1000);
        } else if (providerName === 'gemini' && geminiApiKey) {
            console.log("Processing item with Gemini...");
            finalContent = await withTimeout(processWithGemini(markdown, geminiApiKey, geminiModel, systemPrompt), fetchTimeout * 1000);
        }
    } catch (error) {
        console.error(`AI processing failed for provider '${providerName}', using original content:`, error);
    }
    return finalContent;
}

function isRestrictedPage(tab) {
    if (!tab?.url) {
        return false;
    }
    const restrictedProtocols = ['chrome://', 'edge://', 'brave://', 'chrome-extension://'];
    return restrictedProtocols.some(protocol => tab.url.startsWith(protocol));
}

export {
    callAIProvider,
    isRestrictedPage
}