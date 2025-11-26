/**
 * Smart Tags Generation for Hard Memory
 * Generates relevant topic tags using AI
 */

interface TagGenerationOptions {
  content: string;
  title?: string;
  provider?: 'openrouter' | 'groq' | 'openai' | 'claude' | 'cohere' | 'ollama';
  modelId?: string;
  maxTags?: number;
}

/**
 * Generate smart, relevant tags for memory content using AI
 */
export async function generateSmartTags(options: TagGenerationOptions): Promise<string[]> {
  const {
    content,
    title,
    provider = 'groq',
    modelId = 'llama-3.3-70b-versatile',
    maxTags = 5
  } = options;

  // Create a concise prompt for tag generation
  const tagPrompt = `Analyze this content and generate ${maxTags} relevant topic tags. Tags should be:
- Single words or short phrases (1-3 words)
- Descriptive and specific
- Relevant to the main topics and themes
- Useful for categorization and search

${title ? `Title: ${title}\n\n` : ''}Content: ${content.slice(0, 1000)}${content.length > 1000 ? '...' : ''}

Generate exactly ${maxTags} tags, one per line, no numbers or bullets:`;

  try {
    let generatedTags: string;

    switch (provider) {
      case 'groq':
        generatedTags = await generateTagsWithGroq(tagPrompt, modelId);
        break;
      case 'openrouter':
        generatedTags = await generateTagsWithOpenRouter(tagPrompt, modelId);
        break;
      default:
        // Fallback to simple extraction
        return generateFallbackTags(content, title, maxTags);
    }

    // Parse and clean the generated tags
    const tags = parseGeneratedTags(generatedTags, maxTags);

    // Return the tags or fallback
    return tags.length > 0 ? tags : generateFallbackTags(content, title, maxTags);

  } catch (error) {
    console.error('Error generating smart tags:', error);
    return generateFallbackTags(content, title, maxTags);
  }
}

async function generateTagsWithGroq(prompt: string, modelId: string): Promise<string> {
  const response = await fetch('/api/chat/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      modelId,
      systemPrompt: 'You are a tag generator. Respond with ONLY the tags, one per line, no explanations or extra text.',
    }),
  });

  if (!response.ok) {
    throw new Error('Groq tag generation failed');
  }

  // Handle streaming response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  return fullResponse;
}

async function generateTagsWithOpenRouter(prompt: string, modelId: string): Promise<string> {
  const response = await fetch('/api/chat/openrouter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      modelId,
      systemPrompt: 'You are a tag generator. Respond with ONLY the tags, one per line, no explanations or extra text.',
    }),
  });

  if (!response.ok) {
    throw new Error('OpenRouter tag generation failed');
  }

  // Handle streaming response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  return fullResponse;
}

function parseGeneratedTags(text: string, maxTags: number): string[] {
  if (!text) return [];

  // Split by newlines and clean up
  const tags = text
    .split(/[\n,]/) // Split by newlines or commas
    .map(tag => tag
      .replace(/^[-•\d.)\]]+\s*/, '') // Remove bullets, numbers
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/^#/, '') // Remove hashtags
      .trim()
    )
    .filter(tag => tag.length > 0 && tag.length < 30) // Valid length
    .map(tag => tag.toLowerCase()) // Normalize to lowercase
    .slice(0, maxTags); // Limit to maxTags

  // Remove duplicates
  return [...new Set(tags)];
}

function generateFallbackTags(content: string, title: string | undefined, maxTags: number): string[] {
  // Extract keywords from content and title
  const text = (title ? title + ' ' : '') + content;

  // Remove common words
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'be', 'been', 'are',
    'this', 'that', 'these', 'those', 'it', 'its', 'their', 'there',
    'what', 'which', 'who', 'when', 'where', 'why', 'how',
    'can', 'will', 'would', 'should', 'could', 'may', 'might',
    'have', 'has', 'had', 'do', 'does', 'did', 'not', 'no'
  ]);

  // Extract words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word =>
      word.length > 3 &&
      !commonWords.has(word) &&
      !/^\d+$/.test(word) // Not just numbers
    );

  // Count word frequency
  const frequency: { [word: string]: number } = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and take top tags
  const tags = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([word]) => word);

  return tags.length > 0 ? tags : ['imported'];
}
