#!/bin/bash

# Initialize Git repository
git init

# Create main branch
git checkout -b main

# Create develop branch
git checkout -b develop

# Set up branch protection (requires GitHub CLI or manual setup)
echo "Branch structure created:"
echo "  - main (production)"
echo "  - develop (integration)"
echo ""
echo "Next steps:"
echo "1. Push branches to remote:"
echo "   git remote add origin <your-repo-url>"
echo "   git push -u origin main"
echo "   git push -u origin develop"
echo ""
echo "2. Set up branch protection rules on GitHub/GitLab:"
echo "   - Protect 'main' branch"
echo "   - Require PR reviews (minimum 1)"
echo "   - Require status checks to pass"
echo "   - Require branches to be up to date"
echo ""
echo "3. Create feature branches from develop:"
echo "   git checkout develop"
echo "   git checkout -b feature/OSTORA-XXX-description"
