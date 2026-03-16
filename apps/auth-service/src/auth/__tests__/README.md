# Auth Service Tests

## Test Structure

```
apps/auth-service/src/auth/__tests__/
├── mocks/                          # Mock factories
│   ├── prisma.mock.ts             # PrismaService mock
│   ├── redis.mock.ts              # RedisService mock
│   └── kafka.mock.ts              # Kafka ClientProxy mock
└── unit/                          # Unit tests
    ├── email.vo.spec.ts           # Email value object tests
    ├── password.vo.spec.ts        # Password value object tests
    ├── auth-login.service.spec.ts # Login flow tests
    ├── auth-refresh.service.spec.ts # Refresh token tests
    ├── jwt-auth.guard.spec.ts     # JWT authentication guard tests
    └── roles.guard.spec.ts        # RBAC guard tests
```

## Test Coverage

### Value Objects
- **Email VO**: Valid formats, disposable domains, normalization, edge cases
- **Password VO**: Strength validation, bcrypt hashing (cost 12), comparison, security

### Auth Service
- **Login**: Correct credentials, wrong password, locked account, 2FA flow, new device detection
- **Refresh**: Valid rotation, expired token, blacklisted token, inactive user

### Guards
- **JwtAuthGuard**: Valid JWT, expired, wrong fingerprint, blacklisted, inactive user
- **RolesGuard**: Has permission, missing permission, admin bypass, combined checks

## Running Tests

```bash
# Run all auth-service tests
npm test auth-service

# Run with coverage
npm test auth-service -- --coverage

# Run specific test file
npm test auth-service -- email.vo.spec

# Watch mode
npm test auth-service -- --watch
```

## Coverage Target

- **Branches**: 85%+
- **Functions**: 85%+
- **Lines**: 85%+
- **Statements**: 85%+

## Mocking Strategy

- **PrismaService**: Mock all database operations
- **RedisService**: Mock all cache operations
- **KafkaClient**: Mock event publishing
- **bcrypt**: Mock hashing and comparison for speed

## Best Practices

1. **Arrange-Act-Assert**: Clear test structure
2. **Descriptive names**: Test names explain what they test
3. **Isolated tests**: No dependencies between tests
4. **Mock external dependencies**: Fast, reliable tests
5. **Edge cases**: Test boundary conditions
6. **Security**: Test authentication and authorization flows
