import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from '../../src/profile/profile.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProfileService', () => {
  let service: ProfileService;
  let prisma: PrismaService;

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new profile', async () => {
      const userId = 'user-123';
      const createDto = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        bio: 'Software Engineer',
      };

      const expectedProfile = {
        id: 'profile-123',
        userId,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.profile.create.mockResolvedValue(expectedProfile);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(expectedProfile);
      expect(mockPrismaService.profile.create).toHaveBeenCalledWith({
        data: {
          userId,
          ...createDto,
        },
      });
    });
  });

  describe('updateProfile', () => {
    it('should update an existing profile', async () => {
      const userId = 'user-123';
      const updateDto = {
        firstName: 'Jane',
        bio: 'Senior Software Engineer',
      };

      const existingProfile = {
        id: 'profile-123',
        userId,
        firstName: 'John',
        lastName: 'Doe',
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateDto,
        updatedAt: new Date(),
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(existingProfile);
      mockPrismaService.profile.update.mockResolvedValue(updatedProfile);

      const result = await service.update(userId, updateDto);

      expect(result).toEqual(updatedProfile);
      expect(mockPrismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: updateDto,
      });
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      const userId = 'user-123';
      const updateDto = { firstName: 'Jane' };

      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.update(userId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a profile by userId', async () => {
      const userId = 'user-123';
      const expectedProfile = {
        id: 'profile-123',
        userId,
        firstName: 'John',
        lastName: 'Doe',
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(expectedProfile);

      const result = await service.findOne(userId);

      expect(result).toEqual(expectedProfile);
      expect(mockPrismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      const userId = 'user-123';

      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
