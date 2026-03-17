import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

@Injectable()
export class MySQLReaderService {
  private connection: mysql.Connection;

  constructor(private config: ConfigService) {}

  async connect() {
    this.connection = await mysql.createConnection({
      host: this.config.get('MYSQL_HOST', 'localhost'),
      port: this.config.get('MYSQL_PORT', 3345),
      user: this.config.get('MYSQL_USER', 'root'),
      password: this.config.get('MYSQL_PASSWORD', 'root'),
    });
  }

  async readLinkedInJobs() {
    await this.connection.query('USE linkedin');
    const [rows] = await this.connection.query(
      'SELECT * FROM job_posts WHERE is_active = 1'
    );
    return rows;
  }

  async readStellenJobs() {
    await this.connection.query('USE stellen');
    const [rows] = await this.connection.query(
      'SELECT * FROM stellen WHERE is_active = 1'
    );
    return rows;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}
