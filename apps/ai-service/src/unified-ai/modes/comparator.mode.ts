import { Injectable, Logger } from '@nestjs/common';
import { TokenRouterService, TaskType, TaskPriority } from '../../token-router/token-router.service';
import { ParsedCV, JobPost } from '../../interfaces/analyzer.interface';
import { SkillsGapResult } from '../../interfaces/comparator.interface';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ComparatorMode {
  private readonly logger = new Logger(ComparatorMode.name);
  private readonly redis: Redis;

  constructor(
    private tokenRouter: TokenRouterService,
    private configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  async runGapAnalysis(cv: ParsedCV, jobPost: JobPost): Promise<SkillsGapResult> {
    this.logger.log(`Running skills gap analysis for job: ${jobPost.title}`);

    // Extract skills from CV (TF-IDF, no AI needed, cached)
    const cvSkills = await this.extractSkillsFromCV(cv);
    
    // Extract skills from job (keyword extraction, cached)
    const jobSkills = await this.extractSkillsFromJob(jobPost);

    // Find missing skills
    const missing = jobSkills.filter(skill => 
      !cvSkills.some(cvSkill => 
        cvSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cvSkill.toLowerCase())
      )
    );

    if (missing.length > 0) {
      // Use AI to provide suggestions
      const prompt = this.buildSkillsGapPrompt(missing, jobPost.title, this.getUserLevel(cv));
      
      const aiResponse = await this.tokenRouter.route(
        TaskType.CV_QUICK_SCORE,
        TaskPriority.REALTIME,
        prompt,
        { temperature: 0.3, maxTokens: 1500 },
      );

      return this.parseSkillsGapResponse(aiResponse, missing);
    } else {
      return {
        missing: [],
        verdict: 'Perfect match — apply now!',
      };
    }
  }

  private async extractSkillsFromCV(cv: ParsedCV): Promise<string[]> {
    const cacheKey = `skills:cv:${this.hashCV(cv.text)}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      this.logger.log('Using cached CV skills');
      return JSON.parse(cached);
    }

    // Extract skills using TF-IDF (no AI needed)
    const skills = [
      ...cv.skills,
      ...this.extractSkillsFromText(cv.text),
    ];

    const uniqueSkills = [...new Set(skills)];
    
    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(uniqueSkills));
    
    return uniqueSkills;
  }

  private async extractSkillsFromJob(jobPost: JobPost): Promise<string[]> {
    const cacheKey = `skills:job:${jobPost.id}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      this.logger.log('Using cached job skills');
      return JSON.parse(cached);
    }

    // Keyword extraction from job requirements
    const skills = [
      ...jobPost.skills,
      ...this.extractSkillsFromText(jobPost.requirements),
      ...this.extractSkillsFromText(jobPost.description),
    ];

    const uniqueSkills = [...new Set(skills)];
    
    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(uniqueSkills));
    
    return uniqueSkills;
  }

  private extractSkillsFromText(text: string): string[] {
    // Common tech skills keywords
    const skillKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'Spring',
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Jenkins', 'GitLab', 'GitHub Actions',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'GraphQL', 'REST',
      'Git', 'Agile', 'Scrum', 'CI/CD', 'TDD', 'Microservices', 'API', 'SQL', 'NoSQL',
    ];

    const found = [];
    const lowerText = text.toLowerCase();

    for (const skill of skillKeywords) {
      if (lowerText.includes(skill.toLowerCase())) {
        found.push(skill);
      }
    }

    return found;
  }

  private buildSkillsGapPrompt(missing: string[], jobTitle: string, userLevel: string): string {
    return `You are a career advisor. Analyze these missing skills for a ${userLevel} applying to ${jobTitle}.

Missing skills: ${missing.join(', ')}

Return STRICT JSON:
{
  "suggestedCourses": [
    {
      "skill": "skill name",
      "course": "course name",
      "platform": "Udemy/Coursera/etc",
      "duration": "X weeks"
    }
  ],
  "priorityOrder": ["skill1", "skill2"],
  "estimatedTimeToFill": "X months"
}`;
  }

  private parseSkillsGapResponse(response: string, missing: string[]): SkillsGapResult {
    try {
      const parsed = JSON.parse(response);
      return {
        missing,
        suggestedCourses: parsed.suggestedCourses || [],
        priorityOrder: parsed.priorityOrder || missing,
        estimatedTimeToFill: parsed.estimatedTimeToFill || 'Unknown',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to parse skills gap response: ${errorMessage}`);
      return {
        missing,
        verdict: `You are missing ${missing.length} skills. Consider learning: ${missing.slice(0, 3).join(', ')}`,
      };
    }
  }

  private getUserLevel(cv: ParsedCV): string {
    const totalYears = cv.experience.reduce((sum, exp) => {
      const years = this.extractYears(exp.duration);
      return sum + years;
    }, 0);

    if (totalYears < 2) return 'Junior';
    if (totalYears < 5) return 'Mid-level';
    return 'Senior';
  }

  private extractYears(duration: string): number {
    const match = duration.match(/(\d+)\s*year/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  private hashCV(text: string): string {
    // Simple hash for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  async compare(cvText: string, jobs: any[]) {
    this.logger.log(`Comparing CV against ${jobs.length} jobs`);

    const prompt = `Compare this CV against these jobs and rank them:\n\nCV:\n${cvText}\n\nJobs:\n${jobs.map((j, i) => `${i + 1}. ${j.title} at ${j.company}`).join('\n')}\n\nProvide ranking with match scores.`;

    const result = await this.tokenRouter.route(
      TaskType.JOB_MATCHING,
      TaskPriority.BACKGROUND,
      prompt,
      { maxTokens: 1500 },
    );

    return {
      ranking: result,
      jobCount: jobs.length,
      timestamp: Date.now(),
    };
  }
}
