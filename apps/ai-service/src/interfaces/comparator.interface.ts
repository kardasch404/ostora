export interface SkillsGapResult {
  missing: string[];
  suggestedCourses?: Array<{
    skill: string;
    course: string;
    platform: string;
    duration: string;
  }>;
  priorityOrder?: string[];
  estimatedTimeToFill?: string;
  verdict?: string;
}

export interface ExtractedSkills {
  technical: string[];
  soft: string[];
  tools: string[];
  languages: string[];
}
