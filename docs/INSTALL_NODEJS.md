# Node.js Installation Required

## Quick Install (Choose ONE method)

### Method 1: Direct Download (EASIEST - RECOMMENDED)
1. Open this link in your browser:
   **https://nodejs.org/dist/v23.11.0/node-v23.11.0-x64.msi**

2. Download and run the installer
3. Click "Next" through all steps (accept defaults)
4. Restart your terminal/command prompt
5. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

### Method 2: Using Winget (if Method 1 fails)
Open PowerShell as Administrator and run:
```powershell
winget install OpenJS.NodeJS.23
```

### Method 3: Alternative Latest Version
If v23 has issues, install LTS (Long Term Support):
```powershell
winget install OpenJS.NodeJS.LTS
```
Or download from: https://nodejs.org/

---

## After Node.js Installation

### Step 1: Verify Installation
Open NEW terminal and run:
```cmd
node --version
npm --version
```

Expected output:
```
v23.11.0 (or v20.x.x for LTS)
10.x.x
```

### Step 2: Navigate to Project
```cmd
cd c:\Users\pc\Desktop\ostora
```

### Step 3: Install Project Dependencies
```cmd
npm install
```

### Step 4: Generate Prisma Client
```cmd
npm run prisma:generate
```

### Step 5: Check TypeScript
```cmd
npm run build
```

### Step 6: Format Code
```cmd
npm run format
```

### Step 7: Run Linter
```cmd
npm run lint
```

### Step 8: Run Tests
```cmd
npm run test
```

### Step 9: Commit to Git
```cmd
git add .
git commit -m "chore: initial project setup with microservices architecture, devops config, and infrastructure"
git push origin ostora-config
```

---

## Troubleshooting

### "npm not recognized" after installation
- Close ALL terminal windows
- Open NEW terminal
- Try again

### Installation stuck or fails
- Close all Node.js related processes in Task Manager
- Delete: `C:\Users\pc\AppData\Local\Temp\WinGet`
- Try installation again

### Permission errors
- Run terminal as Administrator
- Right-click Command Prompt → "Run as administrator"

---

## Project Ready Checklist

- [ ] Node.js installed (v23.x or v20.x)
- [ ] npm installed (v10.x)
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated
- [ ] TypeScript compiles without errors
- [ ] Code formatted
- [ ] Linter passes
- [ ] Tests pass
- [ ] Committed to git

---

## Quick Commands Reference

```cmd
# Check versions
node --version
npm --version

# Install dependencies
npm install

# Generate Prisma
npm run prisma:generate

# Build TypeScript
npm run build

# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm run test

# Start Docker infrastructure
npm run docker:up

# Start API Gateway
npm run start:gateway

# Commit changes
git add .
git commit -m "your message"
git push origin ostora-config
```

---

## Download Links

- **Node.js v23:** https://nodejs.org/dist/v23.11.0/node-v23.11.0-x64.msi
- **Node.js LTS:** https://nodejs.org/
- **Git:** https://git-scm.com/download/win
- **Docker Desktop:** https://www.docker.com/products/docker-desktop/

---

## Next Steps After Setup

1. Setup environment variables: `copy .env.example .env`
2. Start infrastructure: `npm run docker:up`
3. Run migrations: `npm run prisma:migrate`
4. Start services: `npm run start:gateway`
5. Access API docs: http://localhost:4717/api/docs
