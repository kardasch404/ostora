import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import { IAiProvider, GenerateOptions } from './provider.interface';

@Injectable()
export class OllamaProvider implements IAiProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get('OLLAMA_API_URL');
    this.model = this.configService.get('OLLAMA_MODEL', 'llama2');
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const systemPrompt = options?.systemPrompt || '';
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: options?.temperature || 0.7,
            num_predict: options?.maxTokens || 500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      this.logger.error(`Ollama generation failed: ${error.message}`);
      throw error;
    }
  }

  async classify(text: string, categories: string[]): Promise<string> {
    const prompt = `Classify this text into one of these categories: ${categories.join(', ')}.\nText: ${text}\nCategory:`;
    const result = await this.generate(prompt, { temperature: 0.3, maxTokens: 50 });
    return result.trim();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
