import { Injectable } from '@nestjs/common';
import { SYSTEM_PROMPTS, JSON_OUTPUT_SUFFIX } from './system-prompts.config';
import { PromptType } from './prompt-type.enum';

type Language = 'en' | 'fr' | 'de';

interface AnalyzeFitData {
  cv: string;
  job: string;
}

interface PersonalizeEmailData {
  job: {
    title: string;
    company: string;
    description?: string;
  };
  userProfile: {
    firstName: string;
    lastName?: string;
    experience?: Array<{ title: string; company: string }>;
    skills?: string[];
  };
  baseTemplate: string;
}

interface GenerateCoverLetterData {
  job: {
    title: string;
    company: string;
    description: string;
    requirements?: string;
  };
  userProfile: {
    firstName: string;
    lastName?: string;
    experience?: string;
    skills?: string[];
    education?: string;
  };
  cvText?: string;
}

interface SkillsGapData {
  missing: string[];
  jobTitle: string;
  currentSkills?: string[];
  targetLevel?: string;
}

interface JobMatchData {
  cvText: string;
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    description: string;
    requirements?: string;
    location?: string;
  }>;
}

@Injectable()
export class PromptBuilderService {
  /**
   * Get system prompt for a specific type and language
   */
  getSystemPrompt(type: PromptType, language: Language = 'en'): string {
    return SYSTEM_PROMPTS[language]?.[type] || SYSTEM_PROMPTS.en[type] || '';
  }

  /**
   * Build prompt with system context and JSON enforcement
   */
  private buildPrompt(type: PromptType, content: string, language: Language = 'en', enforceJson: boolean = true): string {
    const systemPrompt = this.getSystemPrompt(type, language);
    const suffix = enforceJson ? `\n\n${JSON_OUTPUT_SUFFIX}` : '';
    return `${systemPrompt}\n\n${content}${suffix}`;
  }

  /**
   * ANALYZE_FIT: Analyze CV fit against job requirements
   */
  buildAnalyzeFitPrompt(data: AnalyzeFitData, language: Language = 'en'): string {
    const content = `CV:\n${data.cv}\n\nJob offer:\n${data.job}\n\nAnalyze the fit and provide match score, strengths, weaknesses, and recommendations.`;
    return this.buildPrompt(PromptType.ANALYZE_FIT, content, language, true);
  }

  /**
   * PERSONALIZE_EMAIL: Generate personalized application email
   */
  buildPersonalizeEmailPrompt(data: PersonalizeEmailData, language: Language = 'en'): string {
    const experienceText = data.userProfile.experience?.[0] 
      ? `${data.userProfile.experience[0].title} at ${data.userProfile.experience[0].company}`
      : 'Professional';
    
    const skillsText = data.userProfile.skills?.join(', ') || 'various skills';
    
    const content = `Write a professional application email in ${language} for:

Job: ${data.job.title} at ${data.job.company}
Applicant: ${data.userProfile.firstName} ${data.userProfile.lastName || ''}, ${experienceText}
Key Skills: ${skillsText}

Base template:
${data.baseTemplate}

Personalize it while keeping the same language as the template. Make it compelling and professional.`;
    
    return this.buildPrompt(PromptType.PERSONALIZE_EMAIL, content, language, false);
  }

  /**
   * GENERATE_COVER_LETTER: Create formal cover letter
   */
  buildGenerateCoverLetterPrompt(data: GenerateCoverLetterData, language: Language = 'en'): string {
    const content = `Write a formal cover letter in ${language} for:

Position: ${data.job.title}
Company: ${data.job.company}
Job Description: ${data.job.description}
${data.job.requirements ? `Requirements: ${data.job.requirements}` : ''}

Candidate:
Name: ${data.userProfile.firstName} ${data.userProfile.lastName || ''}
${data.userProfile.experience ? `Experience: ${data.userProfile.experience}` : ''}
${data.userProfile.skills ? `Skills: ${data.userProfile.skills.join(', ')}` : ''}
${data.userProfile.education ? `Education: ${data.userProfile.education}` : ''}

${data.cvText ? `CV Summary:\n${data.cvText.substring(0, 500)}...` : ''}

Create a compelling cover letter (max 400 words) that highlights relevant experience and explains why the candidate is perfect for this role.`;
    
    return this.buildPrompt(PromptType.GENERATE_COVER_LETTER, content, language, false);
  }

  /**
   * SKILLS_GAP: Identify missing skills and suggest learning path
   */
  buildSkillsGapPrompt(data: SkillsGapData, language: Language = 'en'): string {
    const content = `Missing skills analysis:

Target Role: ${data.jobTitle}
Missing Skills: ${data.missing.join(', ')}
${data.currentSkills ? `Current Skills: ${data.currentSkills.join(', ')}` : ''}
${data.targetLevel ? `Target Level: ${data.targetLevel}` : ''}

Provide:
1. Priority ranking of skills to learn
2. Learning path with timeline
3. Recommended resources (courses, books, projects)
4. Estimated time to proficiency
5. Quick wins vs long-term investments`;
    
    return this.buildPrompt(PromptType.SKILLS_GAP, content, language, true);
  }

  /**
   * JOB_MATCHER: Match CV against multiple jobs
   */
  buildJobMatchPrompt(data: JobMatchData, language: Language = 'en'): string {
    const jobList = data.jobs.map((job, i) => 
      `${i + 1}. ${job.title} at ${job.company}\n   Location: ${job.location || 'Not specified'}\n   Description: ${job.description.substring(0, 200)}...`
    ).join('\n\n');
    
    const content = `Match this CV to the best jobs:

CV:
${data.cvText}

Available Jobs:
${jobList}

Rank top 5 matches with:
- Match score (0-100)
- Key reasons for match
- Potential concerns
- Application priority`;
    
    return this.buildPrompt(PromptType.JOB_MATCHER, content, language, true);
  }

  /**
   * CV_ANALYZER: Analyze CV quality and provide feedback
   */
  buildCvAnalysisPrompt(cvText: string, jobDescription: string, language: Language = 'en'): string {
    const content = `CV:\n${cvText}\n\nJob Description:\n${jobDescription}\n\nProvide analysis with match score, strengths, missing skills, and suggestions.`;
    return this.buildPrompt(PromptType.CV_ANALYZER, content, language, true);
  }

  /**
   * COVER_LETTER: Legacy method for backward compatibility
   */
  buildCoverLetterPrompt(cvText: string, jobDescription: string, companyName: string, language: Language = 'en'): string {
    const content = `Create a cover letter for this job application.\n\nCV:\n${cvText}\n\nJob Description:\n${jobDescription}\n\nCompany: ${companyName}`;
    return this.buildPrompt(PromptType.COVER_LETTER, content, language, false);
  }

  /**
   * INTENT_DETECTION: Classify user intent
   */
  buildIntentDetectionPrompt(message: string, language: Language = 'en'): string {
    const content = `Classify this user message into one of these intents:
- ANALYZE_CV: User wants CV analysis
- COMPARE_JOB: User wants to compare job offers
- CHAT_ASSIST: General conversation or questions
- FAST_APPLY_SUGGEST: User interested in bulk job applications
- MISSING_SKILLS: User wants skills gap analysis
- GENERATE_COVER_LETTER: User wants cover letter generation
- OPTIMIZE_PROFILE: User wants profile optimization

User message: "${message}"

Return JSON: { "intent": "INTENT_NAME", "confidence": 0.0-1.0 }`;
    
    return this.buildPrompt(PromptType.INTENT_DETECTION, content, language, true);
  }

  /**
   * ASSISTANT: General chat assistant
   */
  buildAssistantPrompt(message: string, context: string = '', language: Language = 'en'): string {
    const content = `${context ? `Context:\n${context}\n\n` : ''}User: ${message}\n\nAssistant:`;
    return this.buildPrompt(PromptType.ASSISTANT, content, language, false);
  }

  /**
   * PROFILE_OPTIMIZER: Optimize LinkedIn/profile
   */
  buildProfileOptimizerPrompt(profileData: any, targetRole: string, language: Language = 'en'): string {
    const content = `Optimize this profile for the role: ${targetRole}

Current Profile:
${JSON.stringify(profileData, null, 2)}

Provide specific suggestions for:
1. Headline optimization
2. Summary/About section
3. Experience descriptions
4. Skills to add/remove
5. Keywords to include
6. Overall profile strength score`;
    
    return this.buildPrompt(PromptType.PROFILE_OPTIMIZER, content, language, true);
  }

  /**
   * Validate language code
   */
  validateLanguage(lang: string): Language {
    const validLanguages: Language[] = ['en', 'fr', 'de'];
    return validLanguages.includes(lang as Language) ? (lang as Language) : 'en';
  }
}
