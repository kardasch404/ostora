# OllamaPromptBuilder - Multilingual Best Practices

## Overview

The OllamaPromptBuilder is a comprehensive prompt engineering service that supports multilingual (EN/FR/DE) AI interactions with best practices for consistent, high-quality outputs.

## Key Features

✅ **Multilingual Support** - English, French, German  
✅ **Type-Safe Prompts** - Enum-based prompt types  
✅ **JSON Enforcement** - Ensures parseable AI responses  
✅ **System Prompts** - Role-based AI behavior  
✅ **Context-Aware** - Builds prompts with relevant context  
✅ **Production-Ready** - Used in Ostora production

## Architecture

```
PromptBuilderService
├── System Prompts (per language)
├── Prompt Types (enum)
├── JSON Output Enforcement
└── Builder Methods (type-specific)
```

## Prompt Types

### 1. Chat & Assistant
- `ASSISTANT` - General conversation
- `INTENT_DETECTION` - Classify user intent

### 2. CV & Profile
- `CV_ANALYZER` - Analyze CV quality
- `ANALYZE_FIT` - Match CV to job
- `SKILLS_GAP` - Identify missing skills
- `PROFILE_OPTIMIZER` - Optimize LinkedIn profile

### 3. Job Matching
- `JOB_MATCHER` - Match CV to multiple jobs
- `JOB_COMPARISON` - Compare job offers

### 4. Email & Cover Letter
- `COVER_LETTER` - Generate cover letter
- `GENERATE_COVER_LETTER` - Formal cover letter
- `EMAIL_GENERATOR` - Professional emails
- `PERSONALIZE_EMAIL` - Customize email templates
- `FAST_APPLY_EMAIL` - Bulk application emails

## Usage Examples

### 1. Analyze CV Fit

```typescript
import { PromptBuilderService } from './prompt-builder.service';

const promptBuilder = new PromptBuilderService();

const prompt = promptBuilder.buildAnalyzeFitPrompt({
  cv: userCvText,
  job: jobDescription,
}, 'en');

// AI will respond with JSON:
// {
//   "matchScore": 85,
//   "strengths": ["5 years React", "AWS certified"],
//   "weaknesses": ["No Docker experience"],
//   "recommendations": ["Learn Kubernetes"]
// }
```

### 2. Personalize Email (Fast Apply)

```typescript
const prompt = promptBuilder.buildPersonalizeEmailPrompt({
  job: {
    title: 'Senior Developer',
    company: 'TechCorp',
  },
  userProfile: {
    firstName: 'John',
    lastName: 'Doe',
    experience: [
      { title: 'Full Stack Developer', company: 'StartupXYZ' }
    ],
    skills: ['React', 'Node.js', 'AWS'],
  },
  baseTemplate: `Dear ~#rh_name,

I am writing to express my interest in the ~#job_title position at ~#company_name.

Best regards,
~#applicant_name`,
}, 'en');

// AI generates personalized email maintaining template structure
```

### 3. Generate Cover Letter

```typescript
const prompt = promptBuilder.buildGenerateCoverLetterPrompt({
  job: {
    title: 'Data Scientist',
    company: 'AI Corp',
    description: 'Looking for ML expert...',
    requirements: 'Python, TensorFlow, 3+ years',
  },
  userProfile: {
    firstName: 'Jane',
    lastName: 'Smith',
    experience: '5 years in ML/AI',
    skills: ['Python', 'TensorFlow', 'PyTorch'],
    education: 'MSc Computer Science',
  },
  cvText: fullCvText,
}, 'fr'); // French cover letter
```

### 4. Skills Gap Analysis

```typescript
const prompt = promptBuilder.buildSkillsGapPrompt({
  missing: ['Kubernetes', 'Docker', 'CI/CD'],
  jobTitle: 'DevOps Engineer',
  currentSkills: ['Linux', 'AWS', 'Python'],
  targetLevel: 'Senior',
}, 'de'); // German response

// AI provides learning path with timeline and resources
```

### 5. Job Matching

```typescript
const prompt = promptBuilder.buildJobMatchPrompt({
  cvText: userCv,
  jobs: [
    {
      id: 'job-1',
      title: 'Frontend Developer',
      company: 'CompanyA',
      description: 'React, TypeScript...',
      location: 'Berlin',
    },
    {
      id: 'job-2',
      title: 'Full Stack Engineer',
      company: 'CompanyB',
      description: 'Node.js, React...',
      location: 'Remote',
    },
  ],
}, 'en');

// AI ranks jobs by fit score with reasoning
```

### 6. Intent Detection

```typescript
const prompt = promptBuilder.buildIntentDetectionPrompt(
  'Can you analyze my CV against this job posting?',
  'en'
);

// Returns: { "intent": "ANALYZE_CV", "confidence": 0.95 }
```

## System Prompts

### English Example
```typescript
[PromptType.ANALYZE_FIT]: `You are an expert recruiter. Analyze how well the candidate's CV matches the job requirements. Provide a detailed fit analysis with match percentage, strengths, weaknesses, and recommendations.`
```

### French Example
```typescript
[PromptType.ANALYZE_FIT]: `Vous êtes un recruteur expert. Analysez dans quelle mesure le CV du candidat correspond aux exigences du poste. Fournissez une analyse détaillée avec pourcentage de correspondance, forces, faiblesses et recommandations.`
```

### German Example
```typescript
[PromptType.ANALYZE_FIT]: `Sie sind ein erfahrener Recruiter. Analysieren Sie, wie gut der Lebenslauf des Kandidaten den Stellenanforderungen entspricht. Geben Sie eine detaillierte Passungsanalyse mit Übereinstimmungsprozentsatz, Stärken, Schwächen und Empfehlungen.`
```

## JSON Output Enforcement

To ensure AI responses are parseable, we append a suffix:

```typescript
export const JSON_OUTPUT_SUFFIX = 
  'Respond ONLY in valid JSON. No markdown. No explanation. No preamble.';
```

This prevents common issues like:
- ❌ Markdown code blocks: \`\`\`json {...} \`\`\`
- ❌ Explanatory text before JSON
- ❌ Invalid JSON syntax
- ✅ Clean, parseable JSON only

## Best Practices

### 1. Always Specify Language
```typescript
// ✅ Good
buildAnalyzeFitPrompt(data, 'fr');

// ❌ Bad (defaults to 'en')
buildAnalyzeFitPrompt(data);
```

### 2. Use Type-Safe Interfaces
```typescript
// ✅ Good
interface PersonalizeEmailData {
  job: { title: string; company: string };
  userProfile: { firstName: string };
  baseTemplate: string;
}

// ❌ Bad
buildPersonalizeEmailPrompt(data: any, lang: string)
```

### 3. Enforce JSON for Structured Data
```typescript
// ✅ Good - Structured output
buildAnalyzeFitPrompt(data, 'en'); // enforceJson: true

// ✅ Good - Free text
buildGenerateCoverLetterPrompt(data, 'en'); // enforceJson: false
```

### 4. Provide Context
```typescript
// ✅ Good - Rich context
buildPersonalizeEmailPrompt({
  job: { title, company, description },
  userProfile: { firstName, experience, skills },
  baseTemplate,
}, 'en');

// ❌ Bad - Minimal context
buildPersonalizeEmailPrompt({
  job: { title },
  userProfile: { firstName },
  baseTemplate,
}, 'en');
```

### 5. Validate Language Input
```typescript
const lang = promptBuilder.validateLanguage(userInput);
// Ensures only 'en' | 'fr' | 'de'
```

## Integration with AI Providers

### BlazeAI (Fast, Premium)
```typescript
const prompt = promptBuilder.buildAnalyzeFitPrompt(data, 'en');
const response = await blazeAiProvider.generate(prompt, {
  temperature: 0.7,
  maxTokens: 500,
});
```

### Ollama (Slower, Free)
```typescript
const prompt = promptBuilder.buildGenerateCoverLetterPrompt(data, 'fr');
const response = await ollamaProvider.generate(prompt, {
  temperature: 0.8,
  maxTokens: 1000,
});
```

## Token Router Integration

```typescript
import { TokenRouterService, TaskType, TaskPriority } from '../token-router';

// Real-time task → BlazeAI
const prompt = promptBuilder.buildIntentDetectionPrompt(message, 'en');
const result = await tokenRouter.route(
  TaskType.INTENT_DETECTION,
  TaskPriority.REALTIME,
  prompt,
  { temperature: 0.2, maxTokens: 50 }
);

// Background task → Ollama
const prompt = promptBuilder.buildGenerateCoverLetterPrompt(data, 'de');
const result = await tokenRouter.route(
  TaskType.COVER_LETTER_BATCH,
  TaskPriority.BACKGROUND,
  prompt,
  { temperature: 0.8, maxTokens: 1000 }
);
```

## Response Parsing

### JSON Responses
```typescript
const prompt = promptBuilder.buildAnalyzeFitPrompt(data, 'en');
const response = await aiProvider.generate(prompt);

try {
  const parsed = JSON.parse(response);
  console.log(parsed.matchScore); // 85
  console.log(parsed.strengths); // ["React", "AWS"]
} catch (error) {
  // Fallback: AI didn't return valid JSON
  console.error('Invalid JSON response');
}
```

### Text Responses
```typescript
const prompt = promptBuilder.buildGenerateCoverLetterPrompt(data, 'fr');
const coverLetter = await aiProvider.generate(prompt);
// Direct text output, no parsing needed
```

## Testing

### Unit Tests
```typescript
describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(() => {
    service = new PromptBuilderService();
  });

  it('should build analyze fit prompt in English', () => {
    const prompt = service.buildAnalyzeFitPrompt({
      cv: 'Test CV',
      job: 'Test Job',
    }, 'en');
    
    expect(prompt).toContain('expert recruiter');
    expect(prompt).toContain('Test CV');
    expect(prompt).toContain('JSON');
  });

  it('should build personalize email prompt in French', () => {
    const prompt = service.buildPersonalizeEmailPrompt({
      job: { title: 'Developer', company: 'TechCo' },
      userProfile: { firstName: 'Jean' },
      baseTemplate: 'Bonjour',
    }, 'fr');
    
    expect(prompt).toContain('professionnel');
    expect(prompt).toContain('Jean');
  });

  it('should validate language codes', () => {
    expect(service.validateLanguage('en')).toBe('en');
    expect(service.validateLanguage('invalid')).toBe('en');
  });
});
```

## Performance Considerations

### Token Usage
- **Intent Detection**: ~50 tokens (BlazeAI)
- **CV Analysis**: ~500 tokens (BlazeAI)
- **Cover Letter**: ~1000 tokens (Ollama)
- **Job Matching**: ~800 tokens (Ollama)

### Response Times
- **BlazeAI**: 1-3 seconds
- **Ollama**: 5-15 seconds (local GPU)

### Cost Optimization
```typescript
// Use BlazeAI for quick tasks
buildIntentDetectionPrompt() // ~50 tokens, fast

// Use Ollama for heavy tasks
buildGenerateCoverLetterPrompt() // ~1000 tokens, slow but free
```

## Multilingual Support

### Supported Languages
- 🇬🇧 **English (en)** - Default
- 🇫🇷 **French (fr)** - Full support
- 🇩🇪 **German (de)** - Full support

### Adding New Languages

1. Add to `system-prompts.config.ts`:
```typescript
export const SYSTEM_PROMPTS = {
  // ... existing
  es: { // Spanish
    [PromptType.ASSISTANT]: `Eres Ostora AI Assistant...`,
    // ... all prompt types
  },
};
```

2. Update type:
```typescript
type Language = 'en' | 'fr' | 'de' | 'es';
```

3. Update validation:
```typescript
validateLanguage(lang: string): Language {
  const validLanguages: Language[] = ['en', 'fr', 'de', 'es'];
  return validLanguages.includes(lang as Language) ? (lang as Language) : 'en';
}
```

## Production Checklist

- [x] Type-safe prompt types (enum)
- [x] Multilingual system prompts (EN/FR/DE)
- [x] JSON output enforcement
- [x] Context-aware builders
- [x] Language validation
- [x] Integration with AI providers
- [x] Token router support
- [x] Error handling
- [ ] Unit tests (TODO)
- [ ] Integration tests (TODO)
- [ ] Performance benchmarks (TODO)

## Common Issues & Solutions

### Issue: AI returns markdown instead of JSON
**Solution**: Use `enforceJson: true` and `JSON_OUTPUT_SUFFIX`

### Issue: Prompt too long (token limit)
**Solution**: Truncate CV text, summarize job description

### Issue: Wrong language response
**Solution**: Explicitly specify language in prompt content

### Issue: Inconsistent output format
**Solution**: Use structured system prompts with clear instructions

## Future Enhancements

1. **Prompt Templates** - Reusable prompt fragments
2. **A/B Testing** - Test different prompt variations
3. **Prompt Versioning** - Track prompt changes over time
4. **Analytics** - Monitor prompt performance
5. **Auto-optimization** - ML-based prompt improvement
6. **More Languages** - Spanish, Italian, Portuguese

## References

- [OpenAI Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [Ollama Documentation](https://ollama.ai/docs)

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintainer**: Ostora AI Team
