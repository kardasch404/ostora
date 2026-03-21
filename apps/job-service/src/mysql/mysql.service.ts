import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

@Injectable()
export class MySQLService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MySQLService.name);
  private pool: mysql.Pool;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.pool = mysql.createPool({
      host: this.config.get('MYSQL_HOST', 'host.docker.internal'),
      port: this.config.get('MYSQL_PORT', 3306),
      user: this.config.get('MYSQL_USER', 'root'),
      password: this.config.get('MYSQL_PASSWORD', ''),
      database: this.config.get('MYSQL_DATABASE', 'stellen'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    this.logger.log('MySQL connection pool initialized');
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('MySQL connection pool closed');
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as T[];
    } catch (error) {
      this.logger.error(`Query failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  getPool(): mysql.Pool {
    return this.pool;
  }
}
