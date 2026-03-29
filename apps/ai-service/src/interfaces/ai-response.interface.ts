export interface AiResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface CvAnalysisResult {
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  suggestions: string[];
  raw: string;
}

export interface CoverLetterResult {
  content: string;
  wordCount: number;
  language: string;
}

export interface JobMatchResult {
  jobId: string;
  matchScore: number;
  reasons: string[];
}

export interface BatchProgress {
  batchId: string;
  total: number;
  completed: number;
  failed: number;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
}
