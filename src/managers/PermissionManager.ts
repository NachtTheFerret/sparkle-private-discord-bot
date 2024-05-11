import type { CallbackParams } from '../types';
import { BaseManager } from './BaseManager';
import { type IPermission, Permission, type PermissionParams } from './Permission';

export class PermissionManager extends BaseManager<Permission, IPermission> {
  override from(item: IPermission | Permission) {
    return item instanceof Permission ? item : new Permission(item);
  }

  public async validate(
    permissions: string | Permission | (string | Permission)[],
    params: CallbackParams<PermissionParams>
  ) {
    const perms = Array.isArray(permissions) ? permissions : [permissions];

    for await (const perm of perms) {
      const p = typeof perm === 'string' ? this.cache.get(perm) : perm;
      if (!p) throw new Error('Permission not found');

      const { valid, condition } = await p.validate(params);
      if (!valid) return { valid, permission: p, condition };
    }

    return { valid: true, permission: null, condition: null };
  }
}
