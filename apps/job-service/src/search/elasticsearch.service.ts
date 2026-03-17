import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { JOB_INDEX_NAME, JOB_INDEX_MAPPING } from './index-mapping';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client;
  private readonly indexName = JOB_INDEX_NAME;

  constructor(private config: ConfigService) {
    this.client = new Client({
      node:
        this.config.get('ELASTICSEARCH_URL') ||
        this.config.get('ELASTICSEARCH_NODE') ||
        'http://localhost:9245',
    });
  }

  async onModuleInit() {
    await this.ensureIndex();
  }

  async ensureIndex() {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      if (!exists) {
        this.logger.log(`Creating index: ${this.indexName}`);
        await this.client.indices.create({
          index: this.indexName,
          body: JOB_INDEX_MAPPING as any,
        });
        this.logger.log(`Index created: ${this.indexName}`);
      }
    } catch (error) {
      this.logger.error('Failed to create index', error);
    }
  }

  async search(query: object) {
    try {
      return await this.client.search({
        index: this.indexName,
        body: query,
      });
    } catch (error) {
      this.logger.error('Search failed', error);
      throw error;
    }
  }

  async indexJob(id: string, job: any) {
    try {
      await this.client.index({
        index: this.indexName,
        id,
        body: job,
        refresh: 'wait_for',
      });
      this.logger.debug(`Indexed job: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to index job: ${id}`, error);
      throw error;
    }
  }

  async bulkIndex(jobs: Array<{ id: string; data: any }>) {
    if (jobs.length === 0) return;

    const body = jobs.flatMap((job) => [
      { index: { _index: this.indexName, _id: job.id } },
      job.data,
    ]);

    try {
      const result = await this.client.bulk({ body, refresh: 'wait_for' });
      if (result.errors) {
        this.logger.error('Bulk index had errors', result.items);
      } else {
        this.logger.log(`Bulk indexed ${jobs.length} jobs`);
      }
      return result;
    } catch (error) {
      this.logger.error('Bulk index failed', error);
      throw error;
    }
  }

  async updateJob(id: string, updates: any) {
    try {
      await this.client.update({
        index: this.indexName,
        id,
        body: { doc: updates },
        refresh: 'wait_for',
      });
      this.logger.debug(`Updated job: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to update job: ${id}`, error);
      throw error;
    }
  }

  async deleteJob(id: string) {
    try {
      await this.client.delete({
        index: this.indexName,
        id,
        refresh: 'wait_for',
      });
      this.logger.debug(`Deleted job: ${id}`);
    } catch (error: unknown) {
      const statusCode =
        typeof error === 'object' &&
        error !== null &&
        'meta' in error &&
        typeof (error as any).meta === 'object' &&
        (error as any).meta !== null
          ? (error as any).meta.statusCode
          : undefined;

      if (statusCode !== 404) {
        this.logger.error(`Failed to delete job: ${id}`, error);
        throw error;
      }
    }
  }

  async deleteIndex() {
    try {
      await this.client.indices.delete({ index: this.indexName });
      this.logger.log(`Deleted index: ${this.indexName}`);
    } catch (error) {
      this.logger.error('Failed to delete index', error);
    }
  }

  async reindex() {
    await this.deleteIndex();
    await this.ensureIndex();
  }
}
