import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import { IAiProvider, GenerateOptions } from './provider.interface';

@Injectable()
export class BlazeAiProvider implements IAiProvider {
  private readonly logger = new Logger(BlazeAiProvider.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get('BLAZEAI_API_URL');
    this.apiKey = this.configService.get('BLAZEAI_API_KEY');
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`BlazeAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      this.logger.error(`BlazeAI generation failed: ${error.message}`);
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
      const response = await fetch(`${this.apiUrl}/v1/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
