# AI Service - BlazeAI Integration

## Overview
AI Service with intelligent token routing between BlazeAI (premium, fast) and Ollama (local, unlimited).

## Core Principle
- **1000 BlazeAI credits/day** - Use for real-time tasks
- **Ollama unlimited (llama3)** - Use for bulk/background tasks
- **Smart routing** - TokenRouter decides based on task type, user plan, and quota
- **Automatic fallback** - BlazeAI errors (429, 5xx) → Ollama
- **Concurrency: 1** - Ollama processes one task at a time (local GPU limit)

## Architecture

### Token Router Strategy
```
BlazeAI (Fast, Limited)          Ollama (Slower, Unlimited)
├─ Real-time chat                ├─ Background CV deep analysis
├─ Intent detection              ├─ Full cover letter generation
├─ Quick email generation        ├─ Job matching TF-IDF scoring
└─ CV quick score                ├─ Profile optimizer (heavy)
                                 └─ Fallback for BlazeAI errors
```

### Quota Management
- Redis key: `blazeai:credits:used:{date}`
- Threshold: 950/1000 credits → switch ALL to Ollama
- Daily reset at midnight
- Fallback: BlazeAI 429/5xx errors → Ollama automatically

## API Endpoints

### POST /api/ai/chat
Real-time chat with intent detection
```json
{
  "message": "Analyze my CV",
  "sessionId": "optional-session-id",
  "language": "en"
}
```

### POST /api/ai/fast-apply
Bulk job application processing
```json
{
  "userId": "user-123",
  "jobIds": ["job-1", "job-2"],
  "concurrency": 5
}
```

### GET /api/ai/credits
Check remaining BlazeAI credits
```json
{
  "remaining": 234,
  "total": 1000
}
```

## Environment Variables
```env
BLAZEAI_API_URL=https://blazeai.boxu.dev
BLAZEAI_API_KEY=your_key
BLAZEAI_DAILY_QUOTA=1000
BLAZEAI_QUOTA_THRESHOLD=950

OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_CONCURRENCY=1

REDIS_HOST=localhost
REDIS_PORT=6345
```

## Ollama Setup

### Install Ollama
```bash
# Windows/Mac/Linux
curl https://ollama.ai/install.sh | sh
```

### Pull llama3 model
```bash
ollama pull llama3
```

### Start Ollama server
```bash
ollama serve
# Runs on http://localhost:11434
```

### Test Ollama
```bash
curl http://localhost:11434/api/tags
```

## Development

### Start service
```bash
npm run start:dev
```

### Test BlazeAI connection
```bash
curl http://localhost:4723/api/ai/credits
```

### Monitor quota
```bash
redis-cli -p 6345 GET "blazeai:credits:used:2025-01-15"
```

## Task Routing Logic

| Task Type | Provider | Concurrency | Reason |
|-----------|----------|-------------|--------|
| Real-time chat | BlazeAI | N/A | Fast response needed |
| Intent detection | BlazeAI | N/A | Tiny prompt, cheap |
| Email generation | BlazeAI | N/A | Quick turnaround |
| CV quick score | BlazeAI | N/A | User waiting |
| Bulk CV analysis | Ollama | 1 | Background job, GPU limit |
| Cover letter batch | Ollama | 1 | No rush, heavy task |
| Job matching | Ollama | 1 | TF-IDF scoring, bulk |
| Profile optimization | Ollama | 1 | Heavy processing |
| BlazeAI fallback | Ollama | 1 | 429/5xx errors |

## Rate Limits (per user/day)
- FREE: 10 requests
- PREMIUM: 100 requests
- B2B: 1000 requests

## Implementation Status
- [x] BullMQ queues for background tasks
- [x] Ollama integration with llama3
- [x] Concurrency control (1 task at a time)
- [x] Automatic fallback mechanism
- [x] Fast-apply orchestration
- [x] PDF parsing worker
- [x] CV analysis queue processor
- [x] Cover letter queue processor
- [x] Job matching processor
- [x] Profile optimizer processor
- [ ] WebSocket for real-time progress
- [ ] Kafka integration
