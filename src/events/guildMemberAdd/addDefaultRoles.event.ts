import type { IEvent } from '../../managers/Event';
import { roles } from '../../config.json';

export default {
  name: 'guildMemberAdd:addDefaultRoles',

  execute: async ({ args: [member] }) => {
    await member.roles.add(roles.member);
  },
} as IEvent<'guildMemberAdd'>;
