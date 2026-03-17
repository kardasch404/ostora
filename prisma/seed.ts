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
