export type LlmProviderType = 'openai' | 'ollama' | 'zhipu';

export interface LlmProviderConfig {
  type: LlmProviderType;
  baseUrl: string;
  model: string;
  apiKey?: string;
  temperature?: number;
}
