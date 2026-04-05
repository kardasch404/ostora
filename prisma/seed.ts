import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with full system access',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Regular user with standard access',
    },
  });

  const b2bRole = await prisma.role.upsert({
    where: { name: 'B2B_CLIENT' },
    update: {},
    create: {
      name: 'B2B_CLIENT',
      description: 'B2B client with API access',
    },
  });

  const premiumRole = await prisma.role.upsert({
    where: { name: 'PREMIUM_USER' },
    update: {},
    create: {
      name: 'PREMIUM_USER',
      description: 'Premium user with extended features and AI access',
    },
  });

  console.log('✅ Roles created:', { adminRole, userRole, b2bRole, premiumRole });

  // Create Permissions
  const permissions = [
    { resource: 'users', action: 'create', description: 'Create users' },
    { resource: 'users', action: 'read', description: 'Read users' },
    { resource: 'users', action: 'update', description: 'Update users' },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'jobs', action: 'create', description: 'Create jobs' },
    { resource: 'jobs', action: 'read', description: 'Read jobs' },
    { resource: 'jobs', action: 'update', description: 'Update jobs' },
    { resource: 'jobs', action: 'delete', description: 'Delete jobs' },
    { resource: 'applications', action: 'create', description: 'Create applications' },
    { resource: 'applications', action: 'read', description: 'Read applications' },
    { resource: 'applications', action: 'update', description: 'Update applications' },
    { resource: 'applications', action: 'delete', description: 'Delete applications' },
    { resource: 'payments', action: 'create', description: 'Create payments' },
    { resource: 'payments', action: 'read', description: 'Read payments' },
    { resource: 'payments', action: 'update', description: 'Update payments' },
    { resource: 'payments', action: 'delete', description: 'Delete payments' },
    { resource: 'analytics', action: 'read', description: 'Read analytics' },
    { resource: 'ai', action: 'access', description: 'Access AI features' },
    { resource: 'roles', action: 'create', description: 'Create roles' },
    { resource: 'roles', action: 'read', description: 'Read roles' },
    { resource: 'roles', action: 'update', description: 'Update roles' },
    { resource: 'roles', action: 'delete', description: 'Delete roles' },
    { resource: 'b2b', action: 'api:access', description: 'B2B API access' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: perm,
    });
    createdPermissions.push(permission);
  }

  console.log(`✅ ${createdPermissions.length} permissions created`);

  // Assign permissions to ADMIN (all permissions)
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ ADMIN role assigned all permissions');

  // Assign permissions to USER (read jobs, create/read/update applications)
  const userPermissions = createdPermissions.filter(
    (p) =>
      (p.resource === 'jobs' && p.action === 'read') ||
      (p.resource === 'applications' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'users' && ['read', 'update'].includes(p.action)),
  );

  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ USER role assigned permissions');

  // Assign permissions to B2B_CLIENT (API access, read jobs, read analytics)
  const b2bPermissions = createdPermissions.filter(
    (p) =>
      (p.resource === 'api' && p.action === 'access') ||
      (p.resource === 'jobs' && p.action === 'read') ||
      (p.resource === 'analytics' && p.action === 'read'),
  );

  for (const permission of b2bPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: b2bRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: b2bRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ B2B_CLIENT role assigned permissions');

  // Assign permissions to PREMIUM_USER (all USER permissions + AI access)
  const premiumPermissions = createdPermissions.filter(
    (p) =>
      (p.resource === 'jobs' && p.action === 'read') ||
      (p.resource === 'applications' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'users' && ['read', 'update'].includes(p.action)) ||
      (p.resource === 'ai' && p.action === 'access'),
  );

  for (const permission of premiumPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: premiumRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: premiumRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ PREMIUM_USER role assigned permissions');

  // Seed a concrete user profile with education and work experience data.
  const targetEmail = 'zz2406143@gmail.com';

  const seededUsers = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    targetEmail,
  );

  const seededUserId = seededUsers[0]?.id || '38c269a8-629d-4aa3-888d-bbe70a09b24b';

  const existingProfile = await prisma.profile.findUnique({
    where: { userId: seededUserId },
    select: { jobPreferences: true },
  });

  const previousJobPreferences =
    existingProfile?.jobPreferences && typeof existingProfile.jobPreferences === 'object'
      ? (existingProfile.jobPreferences as Record<string, unknown>)
      : {};

  const seededWorkEntries = [
    {
      id: 'seed-cw-backend',
      role: 'Back-End-Entwickler',
      company: 'Comply World',
      startDate: '2025-05-01',
      endDate: '',
      current: true,
      summary: 'Python, Data Scraping',
    },
    {
      id: 'seed-alx-cyber',
      role: 'Cyber-Sicherheitsstudent',
      company: 'ALX Morocco',
      startDate: '2026-02-01',
      endDate: '',
      current: true,
      summary: 'Hybrid learning track in cyber security',
    },
    {
      id: 'seed-youcode-fullstack',
      role: 'Full Stack-Entwickler',
      company: 'YouCode Maroc',
      startDate: '2024-09-01',
      endDate: '',
      current: true,
      summary: 'Agile methodologies, VS Code, modern web stack',
    },
  ];

  const profile = await prisma.profile.upsert({
    where: { userId: seededUserId },
    update: {
      firstName: 'Zz',
      lastName: 'User',
      title: 'Back-End-Entwickler',
      company: 'Comply World',
      city: 'Casablanca-Settat',
      country: 'Morocco',
      location: 'Casablanca-Settat, Morocco',
      linkedinUrl: 'https://www.linkedin.com/in/zz2406143',
      jobPreferences: {
        ...previousJobPreferences,
        workEntries: seededWorkEntries,
      },
    },
    create: {
      userId: seededUserId,
      firstName: 'Zz',
      lastName: 'User',
      title: 'Back-End-Entwickler',
      company: 'Comply World',
      city: 'Casablanca-Settat',
      country: 'Morocco',
      location: 'Casablanca-Settat, Morocco',
      linkedinUrl: 'https://www.linkedin.com/in/zz2406143',
      jobPreferences: {
        workEntries: seededWorkEntries,
      },
    },
  });

  await prisma.education.deleteMany({ where: { profileId: profile.id } });
  await prisma.education.createMany({
    data: [
      {
        profileId: profile.id,
        institution: 'UM6P - University Mohammed VI Polytechnic',
        degree: 'Computer Software Engineering',
        field: 'Software Engineering',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2026-04-30'),
        current: false,
        description:
          'State-recognized diploma registered in RNCP Level 6 (roughly Bachelor level in EQF).',
      },
      {
        profileId: profile.id,
        institution: "Faculte des Sciences Ben M'Sik Casablanca",
        degree: 'General Sciences',
        field: 'Science',
        startDate: new Date('2021-09-01'),
        endDate: new Date('2022-06-30'),
        current: false,
      },
      {
        profileId: profile.id,
        institution: 'Omar Khayyam High School, El Youssoufia',
        degree: 'Highschool Degree in Mathematical Sciences A (French option)',
        field: 'Mathematical Sciences',
        startDate: new Date('2018-09-01'),
        endDate: new Date('2021-06-30'),
        current: false,
      },
    ],
  });

  try {
    await prisma.experience.deleteMany({ where: { profileId: profile.id } });
    await prisma.experience.createMany({
      data: [
        {
          profileId: profile.id,
          company: 'Comply World',
          title: 'Back-End-Entwickler',
          location: 'Casablanca-Settat, Morocco (On-site)',
          employmentType: 'FULL_TIME',
          startDate: new Date('2025-05-01'),
          endDate: null,
          current: true,
          description: 'Python, Data Scraping',
        },
        {
          profileId: profile.id,
          company: 'ALX Morocco',
          title: 'Cyber-Sicherheitsstudent',
          location: 'Casablanca-Settat, Morocco (Hybrid)',
          employmentType: 'INTERNSHIP',
          startDate: new Date('2026-02-01'),
          endDate: null,
          current: true,
          description: 'Cyber security training program',
        },
        {
          profileId: profile.id,
          company: 'YouCode Maroc',
          title: 'Full Stack-Entwickler',
          location: 'Youssoufia, Marrakesh-Safi, Morocco (On-site)',
          employmentType: 'INTERNSHIP',
          startDate: new Date('2024-09-01'),
          endDate: null,
          current: true,
          description: 'Agile methodologies, VS Code, and full-stack development',
        },
      ],
    });
  } catch (error: any) {
    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('experience') || !message.includes('does not exist')) {
      throw error;
    }

    console.log('⚠️ Experience table is missing; experience saved in jobPreferences.workEntries only.');
  }

  console.log('✅ Seeded profile, education, and experience for', targetEmail);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
