import { PrismaClient } from '@prisma/client';
import * as mysql from 'mysql2/promise';

const prisma = new PrismaClient();

interface MySQLJob {
  id: number;
  title: string;
  company: string;
  location?: string;
  city?: string;
  country?: string;
  salary?: string;
  contract_type?: string;
  remote?: boolean;
  description: string;
  requirements?: string;
  url: string;
  posted_at?: Date;
  scraped_at?: Date;
}

async function migrate() {
  const mysqlConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3345'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: 'linkedin',
  });

  console.log('🔄 Starting migration from MySQL to PostgreSQL...');

  // Migrate LinkedIn jobs
  const [linkedinJobs] = await mysqlConnection.query<MySQLJob[]>(
    'SELECT * FROM job_posts WHERE is_active = 1'
  );
  console.log(`📊 Found ${linkedinJobs.length} LinkedIn jobs`);

  for (const job of linkedinJobs) {
    await upsertJob(job, 'LINKEDIN');
  }

  // Switch to stellen database
  await mysqlConnection.changeUser({ database: 'stellen' });

  const [stellenJobs] = await mysqlConnection.query<MySQLJob[]>(
    'SELECT * FROM stellen WHERE is_active = 1'
  );
  console.log(`📊 Found ${stellenJobs.length} Stellen jobs`);

  for (const job of stellenJobs) {
    await upsertJob(job, 'STELLEN');
  }

  await mysqlConnection.end();
  await prisma.$disconnect();
  console.log('✅ Migration completed successfully!');
}

async function upsertJob(job: MySQLJob, source: 'LINKEDIN' | 'STELLEN') {
  const company = await prisma.company.upsert({
    where: { name: job.company },
    create: {
      name: job.company,
      city: job.city,
      country: job.country,
    },
    update: {},
  });

  await prisma.jobPost.upsert({
    where: {
      externalId_source: {
        externalId: job.id.toString(),
        source,
      },
    },
    create: {
      externalId: job.id.toString(),
      source,
      title: job.title,
      companyId: company.id,
      location: job.location,
      city: job.city,
      country: job.country,
      salary: job.salary,
      contractType: mapContractType(job.contract_type),
      remote: job.remote || false,
      description: job.description,
      requirements: job.requirements,
      url: job.url,
      postedAt: job.posted_at,
      scrapedAt: job.scraped_at || new Date(),
      isActive: true,
    },
    update: {
      title: job.title,
      location: job.location,
      city: job.city,
      country: job.country,
      salary: job.salary,
      contractType: mapContractType(job.contract_type),
      remote: job.remote || false,
      description: job.description,
      requirements: job.requirements,
      url: job.url,
      postedAt: job.posted_at,
    },
  });
}

function mapContractType(type?: string): 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP' | 'TEMPORARY' | null {
  if (!type) return null;
  const normalized = type.toUpperCase().replace(/[-\s]/g, '_');
  if (['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'TEMPORARY'].includes(normalized)) {
    return normalized as any;
  }
  return null;
}

migrate().catch(console.error);
