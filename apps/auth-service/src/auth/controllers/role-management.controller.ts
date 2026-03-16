import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleManagementService } from '../services/role-management.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from '../dto/role-management.dto';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('Role Management')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(RolesGuard)
export class RoleManagementController {
  constructor(private roleManagementService: RoleManagementService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new role (Admin only)' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.roleManagementService.createRole(dto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all roles (Admin only)' })
  async listRoles() {
    return this.roleManagementService.listRoles();
  }

  @Get(':roleName')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get role by name (Admin only)' })
  async getRoleByName(@Param('roleName') roleName: string) {
    return this.roleManagementService.getRoleByName(roleName);
  }

  @Put(':roleName')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update role (Admin only)' })
  async updateRole(
    @Param('roleName') roleName: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleManagementService.updateRole(roleName, dto);
  }

  @Delete(':roleName')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete role (Admin only)' })
  async deleteRole(@Param('roleName') roleName: string) {
    return this.roleManagementService.deleteRole(roleName);
  }

  @Post('assign')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign role to user (Admin only)' })
  async assignRoleToUser(@Body() dto: AssignRoleDto) {
    return this.roleManagementService.assignRoleToUser(dto);
  }
}
