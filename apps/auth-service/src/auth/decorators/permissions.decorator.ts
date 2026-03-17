import 'reflect-metadata';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => 
  (target: any, _key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(PERMISSIONS_KEY, permissions, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(PERMISSIONS_KEY, permissions, target);
    return target;
  };
