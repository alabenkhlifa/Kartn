import { LLMProvider, ChatCompletionOptions, ChatCompletionResponse } from './types.ts';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class OpenAICompatibleProvider implements LLMProvider {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {}

  private async fetchWithRetry(
    options: ChatCompletionOptions,
    streaming: boolean
  ): Promise<Response> {
    const timeoutMs = streaming ? 15000 : 10000;
    const body = JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 500,
      ...(streaming ? { stream: true } : {}),
      ...(options.response_format ? { response_format: options.response_format } : {}),
    });
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    let lastError: Error | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`LLM API error (${response.status}): ${error}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Don't retry on abort (explicit cancellation, not timeout)
        if (lastError.name === 'AbortError') throw lastError;
        if (attempt === 0) {
          await delay(1000);
        }
      }
    }

    throw lastError!;
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const response = await this.fetchWithRetry(options, false);
    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
    };
  }

  async chatStream(options: ChatCompletionOptions): Promise<ReadableStream<Uint8Array>> {
    const response = await this.fetchWithRetry(options, true);

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    return response.body;
  }
}
