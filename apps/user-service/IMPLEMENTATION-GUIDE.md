# User Service - Task 4.1 Implementation Guide

## ✅ Completed Components

### 1. Prisma Schema Updates
- ✅ Profile model with comprehensive fields
- ✅ Education model with institution, degree, dates
- ✅ Experience model with company, title, employment type
- ✅ Skill model with name, level (BEGINNER/INTERMEDIATE/ADVANCED/EXPERT)
- ✅ Language model with CEFR proficiency (A1-C2)
- ✅ SocialLink model for social media profiles
- ✅ Enums: EmploymentType, SkillLevel, LanguageProficiency

### 2. Infrastructure
- ✅ PrismaService and PrismaModule
- ✅ JwtAuthGuard for route protection
- ✅ CurrentUser decorator for extracting userId
- ✅ main.ts with Swagger setup
- ✅ AppModule with ConfigModule

### 3. Profile Module (Complete)
- ✅ UpdateProfileDto with all fields
- ✅ ProfileResponse DTO
- ✅ ProfileService with CRUD + completeness calculation
- ✅ ProfileController with JWT protection
- ✅ ProfileModule

### 4. Education Module (Complete)
- ✅ CreateEducationDto
- ✅ UpdateEducationDto
- ✅ EducationService with full CRUD
- ✅ EducationController with JWT protection
- ✅ EducationModule

## 📋 Remaining Modules to Implement

### Experience Module
**Files to create:**

```typescript
// src/experience/dto/create-experience.dto.ts
import { IsString, IsOptional, IsDateString, IsBoolean, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';

export class CreateExperienceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  company: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ enum: EmploymentType })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  current?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

// src/experience/dto/update-experience.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateExperienceDto } from './create-experience.dto';

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}

// src/experience/experience.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperienceService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateExperienceDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.experience.create({
      data: {
        profileId: profile.id,
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async findAll(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { experience: { orderBy: { startDate: 'desc' } } },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile.experience;
  }

  async findOne(userId: string, id: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!experience) throw new NotFoundException('Experience not found');
    if (experience.profile.userId !== userId) throw new ForbiddenException('Access denied');
    return experience;
  }

  async update(userId: string, id: string, dto: UpdateExperienceDto) {
    await this.findOne(userId, id);
    return this.prisma.experience.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.experience.delete({ where: { id } });
  }
}

// src/experience/experience.controller.ts
// Same pattern as EducationController

// src/experience/experience.module.ts
import { Module } from '@nestjs/common';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExperienceController],
  providers: [ExperienceService],
})
export class ExperienceModule {}
```

### Skill Module
**Files to create:**

```typescript
// src/skill/dto/create-skill.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillLevel } from '@prisma/client';

export class CreateSkillDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: SkillLevel })
  @IsEnum(SkillLevel)
  level: SkillLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;
}

// src/skill/skill.service.ts
// Similar pattern to EducationService with unique constraint on [profileId, name]

// src/skill/skill.controller.ts
// Same CRUD pattern

// src/skill/skill.module.ts
```

### Language Module
**Files to create:**

```typescript
// src/language/dto/create-language.dto.ts
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LanguageProficiency } from '@prisma/client';

export class CreateLanguageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: LanguageProficiency })
  @IsEnum(LanguageProficiency)
  proficiency: LanguageProficiency;
}

// src/language/language.service.ts
// Similar pattern with unique constraint on [profileId, name]

// src/language/language.controller.ts
// Same CRUD pattern

// src/language/language.module.ts
```

### SocialLink Module
**Files to create:**

```typescript
// src/social-link/dto/create-social-link.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSocialLinkDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  platform: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;
}

// src/social-link/social-link.service.ts
// Similar pattern with unique constraint on [profileId, platform]

// src/social-link/social-link.controller.ts
// Same CRUD pattern

// src/social-link/social-link.module.ts
```

## 🔧 Next Steps

1. **Run Prisma Migration**
```bash
npx prisma migrate dev --name add_profile_relations
npx prisma generate
```

2. **Create Remaining Modules**
- Copy the pattern from EducationModule
- Implement Experience, Skill, Language, SocialLink modules
- Add to AppModule imports

3. **Add to AppModule**
```typescript
imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  PrismaModule,
  ProfileModule,
  EducationModule,
  ExperienceModule,
  SkillModule,
  LanguageModule,
  SocialLinkModule,
],
```

4. **Test Endpoints**
```bash
# Start service
npm run start:dev

# Test with Swagger
http://localhost:4719/api/v1/docs
```

## 📊 API Endpoints Summary

### Profile
- GET /api/v1/profile - Get profile
- POST /api/v1/profile - Create profile
- PATCH /api/v1/profile - Update profile
- DELETE /api/v1/profile - Delete profile
- GET /api/v1/profile/completeness - Get completeness %

### Education
- GET /api/v1/education - List all
- POST /api/v1/education - Create
- GET /api/v1/education/:id - Get one
- PATCH /api/v1/education/:id - Update
- DELETE /api/v1/education/:id - Delete

### Experience (Same pattern)
- GET /api/v1/experience
- POST /api/v1/experience
- GET /api/v1/experience/:id
- PATCH /api/v1/experience/:id
- DELETE /api/v1/experience/:id

### Skills (Same pattern)
- GET /api/v1/skills
- POST /api/v1/skills
- GET /api/v1/skills/:id
- PATCH /api/v1/skills/:id
- DELETE /api/v1/skills/:id

### Languages (Same pattern)
- GET /api/v1/languages
- POST /api/v1/languages
- GET /api/v1/languages/:id
- PATCH /api/v1/languages/:id
- DELETE /api/v1/languages/:id

### Social Links (Same pattern)
- GET /api/v1/social-links
- POST /api/v1/social-links
- GET /api/v1/social-links/:id
- PATCH /api/v1/social-links/:id
- DELETE /api/v1/social-links/:id

## 🎯 Best Practices Implemented

1. **JWT Protection** - All endpoints protected with @UseGuards(JwtAuthGuard)
2. **CurrentUser Decorator** - Extracts userId from JWT token
3. **Validation** - class-validator on all DTOs
4. **Swagger Documentation** - Complete API docs
5. **Error Handling** - NotFoundException, ForbiddenException
6. **Ownership Verification** - Users can only access their own data
7. **Cascade Delete** - Profile deletion removes all related data
8. **Unique Constraints** - Prevent duplicate skills/languages per profile
9. **Ordering** - Education/Experience ordered by date DESC
10. **Profile Completeness** - Calculate % completion for gamification

## 🚀 Commit Messages

```bash
feat(USER-1): Prisma models for profile, education, experience, skills, languages
feat(USER-1): CRUD endpoints for profile with JWT protection
feat(USER-1): CRUD for education, experience, skills, languages
```
