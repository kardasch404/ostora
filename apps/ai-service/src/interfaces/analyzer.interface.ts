export interface ParsedCV {
  text: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  languages: string[];
  certifications: string[];
}

export interface JobPost {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  skills: string[];
  location?: string;
  salary?: string;
}

export interface AnalyzeFitResult {
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  verdict: string;
}

export interface AnalyzeStandaloneResult {
  overallScore: number;
  skills: string[];
  experience: string[];
  suggestions: string[];
  profileCompleteness: number;
}
