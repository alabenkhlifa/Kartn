export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
  stream?: boolean;
}

export interface ChatCompletionResponse {
  content: string;
}

export interface LLMProvider {
  chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;
  chatStream(options: ChatCompletionOptions): Promise<ReadableStream<Uint8Array>>;
}
