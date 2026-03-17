import 'reflect-metadata';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => (target: any, _key?: string, descriptor?: PropertyDescriptor) => {
  if (descriptor) {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor.value);
    return descriptor;
  }
  Reflect.defineMetadata(ROLES_KEY, roles, target);
  return target;
};
