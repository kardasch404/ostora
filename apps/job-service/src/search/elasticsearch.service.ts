import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElasticsearchService {
  private client: Client;
  private readonly indexName = 'ostora-jobs';

  constructor(private config: ConfigService) {
    this.client = new Client({
      node: config.get('ELASTICSEARCH_URL', 'http://localhost:9245'),
    });
  }

  async search(query: object) {
    return this.client.search({
      index: this.indexName,
      body: query,
    });
  }

  async indexJob(id: string, job: any) {
    return this.client.index({
      index: this.indexName,
      id,
      body: job,
    });
  }

  async deleteJob(id: string) {
    return this.client.delete({
      index: this.indexName,
      id,
    });
  }

  async createIndex() {
    const exists = await this.client.indices.exists({ index: this.indexName });
    if (!exists) {
      await this.client.indices.create({
        index: this.indexName,
        body: {
          mappings: {
            properties: {
              title: { type: 'text' },
              description: { type: 'text' },
              city: { type: 'keyword' },
              country: { type: 'keyword' },
              remote: { type: 'boolean' },
              contractType: { type: 'keyword' },
              salary: { type: 'integer' },
              postedAt: { type: 'date' },
              isActive: { type: 'boolean' },
            },
          },
        },
      });
    }
  }
}
