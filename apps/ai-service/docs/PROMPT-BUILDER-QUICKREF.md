# Prompt Builder - Quick Reference

## Import

```typescript
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { PromptType } from './prompt-builder/prompt-type.enum';
```

## Quick Examples

### 1. Analyze CV Fit
```typescript
const prompt = promptBuilder.buildAnalyzeFitPrompt({
  cv: cvText,
  job: jobDescription,
}, 'en');
```

### 2. Personalize Email
```typescript
const prompt = promptBuilder.buildPersonalizeEmailPrompt({
  job: { title: 'Developer', company: 'TechCorp' },
  userProfile: { firstName: 'John', skills: ['React'] },
  baseTemplate: emailTemplate,
}, 'fr');
```

### 3. Generate Cover Letter
```typescript
const prompt = promptBuilder.buildGenerateCoverLetterPrompt({
  job: { title, company, description },
  userProfile: { firstName, experience, skills },
}, 'de');
```

### 4. Skills Gap
```typescript
const prompt = promptBuilder.buildSkillsGapPrompt({
  missing: ['Docker', 'K8s'],
  jobTitle: 'DevOps Engineer',
}, 'en');
```

### 5. Job Matching
```typescript
const prompt = promptBuilder.buildJobMatchPrompt({
  cvText: cv,
  jobs: jobsList,
}, 'en');
```

### 6. Intent Detection
```typescript
const prompt = promptBuilder.buildIntentDetectionPrompt(
  userMessage,
  'en'
);
```

## All Prompt Types

| Type | Method | JSON Output | Use Case |
|------|--------|-------------|----------|
| ANALYZE_FIT | `buildAnalyzeFitPrompt()` | ✅ | CV vs Job match |
| PERSONALIZE_EMAIL | `buildPersonalizeEmailPrompt()` | ❌ | Fast Apply emails |
| GENERATE_COVER_LETTER | `buildGenerateCoverLetterPrompt()` | ❌ | Cover letters |
| SKILLS_GAP | `buildSkillsGapPrompt()` | ✅ | Learning paths |
| JOB_MATCHER | `buildJobMatchPrompt()` | ✅ | Multi-job ranking |
| CV_ANALYZER | `buildCvAnalysisPrompt()` | ✅ | CV quality check |
| INTENT_DETECTION | `buildIntentDetectionPrompt()` | ✅ | User intent |
| ASSISTANT | `buildAssistantPrompt()` | ❌ | General chat |
| PROFILE_OPTIMIZER | `buildProfileOptimizerPrompt()` | ✅ | LinkedIn optimization |

## Languages

- `'en'` - English (default)
- `'fr'` - French
- `'de'` - German

## Best Practices

✅ **DO**
- Always specify language
- Use type-safe interfaces
- Provide rich context
- Validate language input

❌ **DON'T**
- Use `any` types
- Skip language parameter
- Send minimal context
- Assume default language

## Integration

### With BlazeAI
```typescript
const prompt = promptBuilder.buildIntentDetectionPrompt(msg, 'en');
const result = await blazeAi.generate(prompt, { maxTokens: 50 });
```

### With Ollama
```typescript
const prompt = promptBuilder.buildGenerateCoverLetterPrompt(data, 'fr');
const result = await ollama.generate(prompt, { maxTokens: 1000 });
```

### With Token Router
```typescript
const prompt = promptBuilder.buildAnalyzeFitPrompt(data, 'en');
const result = await tokenRouter.route(
  TaskType.CV_QUICK_SCORE,
  TaskPriority.REALTIME,
  prompt
);
```

## Common Patterns

### Pattern 1: Real-time Analysis
```typescript
// Quick, structured response
const prompt = promptBuilder.buildAnalyzeFitPrompt(data, lang);
const response = await blazeAi.generate(prompt);
const parsed = JSON.parse(response);
```

### Pattern 2: Background Generation
```typescript
// Slow, detailed text
const prompt = promptBuilder.buildGenerateCoverLetterPrompt(data, lang);
const coverLetter = await ollama.generate(prompt);
```

### Pattern 3: Multilingual Support
```typescript
const userLang = req.headers['accept-language'] || 'en';
const lang = promptBuilder.validateLanguage(userLang);
const prompt = promptBuilder.buildPersonalizeEmailPrompt(data, lang);
```

## Troubleshooting

**Problem**: AI returns markdown
**Solution**: Check `enforceJson` flag

**Problem**: Wrong language
**Solution**: Validate language input

**Problem**: Token limit exceeded
**Solution**: Truncate input text

**Problem**: Inconsistent format
**Solution**: Use system prompts

---

For full documentation, see `OLLAMA-PROMPT-BUILDER.md`
