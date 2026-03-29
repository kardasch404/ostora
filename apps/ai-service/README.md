# AI Service - BlazeAI Integration

## Overview
AI Service with intelligent token routing between BlazeAI (premium, fast) and Ollama (local, unlimited).

## Core Principle
- **1000 BlazeAI credits/day** - Use for real-time tasks
- **Ollama unlimited** - Use for bulk/background tasks
- **Smart routing** - TokenRouter decides based on task type, user plan, and quota

## Architecture

### Token Router Strategy
```
BlazeAI (Fast, Limited)          Ollama (Slower, Unlimited)
├─ Real-time chat                ├─ Bulk CV analysis
├─ Intent detection              ├─ Cover letter batches
├─ Quick email generation        ├─ Job matching
└─ CV quick score                └─ Profile optimization
```

### Quota Management
- Redis key: `blazeai:credits:used:{date}`
- Threshold: 950/1000 credits → switch ALL to Ollama
- Daily reset at midnight

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
OLLAMA_MODEL=llama2

REDIS_HOST=localhost
REDIS_PORT=6345
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

| Task Type | Provider | Reason |
|-----------|----------|--------|
| Real-time chat | BlazeAI | Fast response needed |
| Intent detection | BlazeAI | Tiny prompt, cheap |
| Email generation | BlazeAI | Quick turnaround |
| CV quick score | BlazeAI | User waiting |
| Bulk CV analysis | Ollama | Background job |
| Cover letter batch | Ollama | No rush |
| Job matching | Ollama | Heavy processing |
| Profile optimization | Ollama | Background task |

## Rate Limits (per user/day)
- FREE: 10 requests
- PREMIUM: 100 requests
- B2B: 1000 requests

## Next Steps
- [ ] Implement BullMQ queues for background tasks
- [ ] Add WebSocket for real-time progress
- [ ] Implement fast-apply orchestration
- [ ] Add PDF parsing worker
- [ ] Create CV analysis queue processor
