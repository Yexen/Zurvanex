import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@/types';

// Initialize Anthropic client
export function createAnthropicClient(apiKey: string) {
  return new Anthropic({ apiKey });
}

/**
 * Send message to Claude with streaming support
 */
export async function sendClaudeMessage(
  messages: Message[],
  modelId: string,
  apiKey: string,
  onChunk?: (chunk: string) => void,
  systemPrompt?: string
): Promise<string> {
  const anthropic = createAnthropicClient(apiKey);

  // Convert our messages to Claude format
  const formattedMessages = messages.map((msg) => {
    // If message has images, use multimodal content format
    if (msg.images && msg.images.length > 0) {
      const content: Array<
        | { type: 'text'; text: string }
        | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string } }
      > = [{ type: 'text', text: msg.content }];

      // Add all images
      for (const imageData of msg.images) {
        // Extract base64 data and media type
        let base64Data = imageData;
        let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/png';

        if (imageData.startsWith('data:')) {
          const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const detectedType = match[1];
            // Map detected type to Claude's accepted types
            if (detectedType === 'image/jpeg' || detectedType === 'image/jpg') {
              mediaType = 'image/jpeg';
            } else if (detectedType === 'image/png') {
              mediaType = 'image/png';
            } else if (detectedType === 'image/gif') {
              mediaType = 'image/gif';
            } else if (detectedType === 'image/webp') {
              mediaType = 'image/webp';
            }
            base64Data = match[2];
          }
        }

        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data,
          },
        });
      }

      return {
        role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content,
      };
    }

    // Regular text message
    return {
      role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: msg.content,
    };
  });

  try {
    if (onChunk) {
      // Streaming response
      const stream = await anthropic.messages.create({
        model: modelId,
        max_tokens: 8192,
        temperature: 0.7,
        messages: formattedMessages,
        ...(systemPrompt && { system: systemPrompt }),
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          const content = chunk.delta.text;
          if (content) {
            fullResponse += content;
            onChunk(content);
          }
        }
      }
      return fullResponse;
    } else {
      // Non-streaming response
      const message = await anthropic.messages.create({
        model: modelId,
        max_tokens: 8192,
        temperature: 0.7,
        messages: formattedMessages,
        ...(systemPrompt && { system: systemPrompt }),
        stream: false,
      });

      const content = message.content[0];
      return content.type === 'text' ? content.text : '';
    }
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

/**
 * Available Claude models
 */
export const CLAUDE_MODELS = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    description: 'Current best - latest flagship model',
    contextWindow: 200000,
    hasThinkingMode: true,
    supportsVision: true,
    isFree: false,
  },
  {
    id: 'claude-opus-4-1',
    name: 'Claude Opus 4.1',
    description: 'Most capable - for the hardest tasks',
    contextWindow: 200000,
    hasThinkingMode: true,
    supportsVision: true,
    isFree: false,
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    description: 'Fastest - quick and efficient responses',
    contextWindow: 200000,
    hasThinkingMode: false,
    supportsVision: true,
    isFree: false,
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    description: 'Most intelligent model, balanced performance',
    contextWindow: 200000,
    hasThinkingMode: true,
    supportsVision: true,
    isFree: false,
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude 4 Opus',
    description: 'Most capable model for complex tasks',
    contextWindow: 200000,
    hasThinkingMode: true,
    supportsVision: true,
    isFree: false,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Previous flagship model',
    contextWindow: 200000,
    hasThinkingMode: false,
    supportsVision: true,
    isFree: false,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Fast and affordable',
    contextWindow: 200000,
    hasThinkingMode: false,
    supportsVision: true,
    isFree: false,
  },
];
