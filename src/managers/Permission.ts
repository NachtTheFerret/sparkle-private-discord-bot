import type {
  EmbedData,
  Guild,
  GuildChannel,
  GuildMember,
  Interaction,
  Message,
  PermissionResolvable,
  Role,
  User,
} from 'discord.js';
import type { Callback, CallbackParams } from '../types';
import { Base, type IBase } from './Base';
import type { BaseExecutable, IBaseExecutable } from './BaseExecutable';

export interface PermissionParams {
  guild?: Guild | null;
  user?: User | null;
  role?: Role | null;
  channel?: GuildChannel | null;
  member?: GuildMember | null;
  message?: Message | null;
  interaction?: Interaction | null;
  from?: BaseExecutable<IBaseExecutable> | null;
}

export interface IBasePermissionCondition {
  label?: string | null;
  type: 'USER' | 'ROLE' | 'CHANNEL' | 'GUILD' | 'MEMBER' | 'CUSTOM' | 'GROUP';
  operator?: 'OR' | 'AND';
  optional?: boolean | null;
}

export interface IStaticPermissionCondition extends IBasePermissionCondition {
  type: 'USER' | 'CHANNEL' | 'GUILD';
  allowed?: string[] | null;
  denied?: string[] | null;
}

export interface IPermPermissionCondition extends IBasePermissionCondition {
  type: 'ROLE' | 'MEMBER';
  allowed?: string[] | null;
  denied?: string[] | null;
  needed?: PermissionResolvable | null;
}

export interface ICustomPermissionCondition extends IBasePermissionCondition {
  type: 'CUSTOM';
  condition: Callback<PermissionParams, boolean>;
}

export interface IGroupPermissionCondition extends IBasePermissionCondition {
  type: 'GROUP';
  conditions: IPermissionCondition[] | null;
}

export type IPermissionCondition =
  | IStaticPermissionCondition
  | ICustomPermissionCondition
  | IGroupPermissionCondition
  | IPermPermissionCondition;

export interface IPermission extends IBase {
  conditions?: IPermissionCondition[] | IPermissionCondition | null;
  message?: string | EmbedData | Callback<PermissionParams | string | EmbedData | null | undefined> | null;

  lastValidated?: number | null;
}

export class Permission extends Base<IPermission> implements IPermission {
  conditions?: IPermissionCondition[] | IPermissionCondition | null;
  message?: string | EmbedData | Callback<PermissionParams | string | EmbedData | null | undefined> | null;

  lastValidated?: number | null;

  constructor(data?: IPermission) {
    super(data);
    this.conditions = data?.conditions || null;
    this.message = data?.message || null;
    this.lastValidated = data?.lastValidated || null;
  }

  public async validate(params: CallbackParams<PermissionParams>) {
    if (!this.conditions) return { valid: false, condition: null };
    if (!this.enabled) return { valid: false, condition: null };

    this.lastValidated = Date.now();

    const conditions = Array.isArray(this.conditions) ? this.conditions : [this.conditions];
    let result = { valid: false, condition: null as IPermissionCondition | null };

    for await (const condition of conditions) {
      const { valid: v, condition: c } = await this.validateCondition(condition, params);
      if (condition.operator === 'OR' && v) {
        result.valid = true;
        break;
      } else if ((condition.operator === 'AND' || !condition.operator) && !v) {
        result = { valid: condition.optional || false, condition: c };
        break;
      } else {
        result.valid = condition.optional || v || false;
        if (!result.valid) result.condition = c;
      }
    }

    return result;
  }

  public async validateCondition(
    condition: IPermissionCondition,
    params: CallbackParams<PermissionParams>
  ): Promise<{ valid: boolean; condition: IPermissionCondition }> {
    if (condition.type === 'USER') return this.validateUser(condition, params);
    if (condition.type === 'ROLE') return this.validateRole(condition, params);
    if (condition.type === 'CHANNEL') return this.validateChannel(condition, params);
    if (condition.type === 'GUILD') return this.validateGuild(condition, params);
    if (condition.type === 'MEMBER') return this.validateMember(condition, params);
    if (condition.type === 'CUSTOM') return this.validateCustom(condition, params);
    if (condition.type === 'GROUP') return this.validateGroup(condition, params);
    return { valid: false, condition };
  }

  public async validateGroup(group: IGroupPermissionCondition, params: CallbackParams<PermissionParams>) {
    let result = { valid: false, condition: group as IPermissionCondition };

    for await (const condition of group.conditions || []) {
      const { valid: v, condition: c } = await this.validateCondition(condition, params);

      if (condition.operator === 'OR' && v) {
        result.valid = true;
        break;
      } else if ((condition.operator === 'AND' || !condition.operator) && !v) {
        result = { valid: condition.optional || false, condition: c };
        break;
      } else {
        result.valid = condition.optional || v || false;
        if (!result.valid) result.condition = c;
      }
    }

    return result;
  }

  public validateUser(condition: IStaticPermissionCondition, params: CallbackParams<PermissionParams>) {
    let valid = false;
    if (!params.user) valid = false;
    else if (condition.allowed && condition.allowed.includes(params.user.id)) valid = true;
    else if (condition.denied && condition.denied.includes(params.user.id)) valid = false;
    valid = condition.optional || valid || false;
    return { valid, condition };
  }

  public validateRole(condition: IPermPermissionCondition, params: CallbackParams<PermissionParams>) {
    let valid = false;
    if (!params.role) valid = false;
    else if (condition.allowed && condition.allowed.includes(params.role.id)) valid = true;
    else if (condition.denied && condition.denied.includes(params.role.id)) valid = false;
    else if (condition.needed && !params.role.permissions.has(condition.needed)) valid = false;
    valid = condition.optional || valid || false;
    return { valid, condition };
  }

  public validateChannel(condition: IStaticPermissionCondition, params: CallbackParams<PermissionParams>) {
    let valid = false;
    if (!params.channel) valid = false;
    else if (condition.allowed && condition.allowed.includes(params.channel.id)) valid = true;
    else if (condition.denied && condition.denied.includes(params.channel.id)) valid = false;
    valid = condition.optional || valid || false;
    return { valid, condition };
  }

  public validateGuild(condition: IStaticPermissionCondition, params: CallbackParams<PermissionParams>) {
    let valid = false;
    if (!params.guild) valid = false;
    else if (condition.allowed && condition.allowed.includes(params.guild.id)) valid = true;
    else if (condition.denied && condition.denied.includes(params.guild.id)) valid = false;
    valid = condition.optional || valid || false;
    return { valid, condition };
  }

  public validateMember(condition: IPermPermissionCondition, params: CallbackParams<PermissionParams>) {
    let valid = false;
    if (!params.member) valid = false;
    else if (condition.allowed && condition.allowed.includes(params.member.id)) valid = true;
    else if (condition.denied && condition.denied.includes(params.member.id)) valid = false;
    else if (condition.needed && !params.member.permissions.has(condition.needed)) valid = false;
    valid = condition.optional || valid || false;
    return { valid, condition };
  }

  public async validateCustom(condition: ICustomPermissionCondition, params: CallbackParams<PermissionParams>) {
    const valid = await condition.condition(params);
    return { valid, condition };
  }
}
