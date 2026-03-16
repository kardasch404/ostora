import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacService } from './rbac.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from '../dto/role-management.dto';

@Injectable()
export class RoleManagementService {
  constructor(
    private prisma: PrismaService,
    private rbacService: RbacService,
  ) {}

  async createRole(dto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existingRole) {
      throw new ConflictException(`Role ${dto.name} already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    if (dto.permissions && dto.permissions.length > 0) {
      await this.assignPermissionsToRole(role.id, dto.permissions);
    }

    return this.getRoleWithPermissions(role.id);
  }

  async updateRole(roleName: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    await this.prisma.role.update({
      where: { id: role.id },
      data: { description: dto.description },
    });

    if (dto.permissions) {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      if (dto.permissions.length > 0) {
        await this.assignPermissionsToRole(role.id, dto.permissions);
      }
    }

    await this.rbacService.invalidateRoleCache(roleName);

    return this.getRoleWithPermissions(role.id);
  }

  async deleteRole(roleName: string) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    const userCount = await this.prisma.user.count({
      where: { roleId: role.id },
    });

    if (userCount > 0) {
      throw new ConflictException(
        `Cannot delete role ${roleName}. ${userCount} users are assigned to this role`,
      );
    }

    await this.rbacService.invalidateRoleCache(roleName);

    await this.prisma.role.delete({
      where: { id: role.id },
    });

    return { message: `Role ${roleName} deleted successfully` };
  }

  async assignRoleToUser(dto: AssignRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    const role = await this.prisma.role.findUnique({
      where: { name: dto.roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role ${dto.roleName} not found`);
    }

    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { roleId: role.id },
    });

    await this.rbacService.invalidateUserCache(dto.userId);

    return { message: `Role ${dto.roleName} assigned to user ${dto.userId}` };
  }

  async listRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async getRoleByName(roleName: string) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    return role;
  }

  private async assignPermissionsToRole(roleId: string, permissions: string[]) {
    for (const perm of permissions) {
      const [resource, action] = perm.split(':');

      let permission = await this.prisma.permission.findUnique({
        where: { resource_action: { resource, action } },
      });

      if (!permission) {
        permission = await this.prisma.permission.create({
          data: { resource, action },
        });
      }

      await this.prisma.rolePermission.create({
        data: {
          roleId,
          permissionId: permission.id,
        },
      });
    }
  }

  private async getRoleWithPermissions(roleId: string) {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }
}
