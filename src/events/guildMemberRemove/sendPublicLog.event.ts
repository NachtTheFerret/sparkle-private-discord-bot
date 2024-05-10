import type { IEvent } from '../../managers/Event';
import { channels, guild_id, emojis } from '../../config.json';

export default {
  name: 'guildMemberRemove:sendPublicLog',

  execute: async ({ args: [member], client }) => {
    const guild = await client.guilds.fetch(guild_id);
    if (!guild) throw new Error(`Guild (${guild_id}) not found`);

    const channel = await guild.channels.fetch(channels.logs.public);
    if (!channel) throw new Error(`Channel (${channels.logs.public}) not found`);
    if (!channel.isTextBased()) throw new Error(`Channel (${channels.logs.public}) is not a text channel`);

    const emoji = await guild.emojis.fetch(emojis.leave);
    if (!emoji) throw new Error(`Emoji (${emojis.leave}) not found`);

    await channel.send(`${emoji}   ${member.user.username} (${member.id}) has left the server.`);
  },
} as IEvent<'guildMemberRemove'>;
