export interface IAiProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  classify(text: string, categories: string[]): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  language?: 'en' | 'fr' | 'de';
}
