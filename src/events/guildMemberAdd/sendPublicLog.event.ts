import type { IEvent } from '../../managers/Event';
import { channels, guild_id, emojis } from '../../config.json';

export default {
  name: 'guildMemberAdd:sendPublicLog',

  execute: async ({ args: [member], client }) => {
    const guild = await client.guilds.fetch(guild_id);
    if (!guild) throw new Error(`Guild (${guild_id}) not found`);

    const channel = await guild.channels.fetch(channels.logs.public);
    if (!channel) throw new Error(`Channel (${channels.logs.public}) not found`);
    if (!channel.isTextBased()) throw new Error(`Channel (${channels.logs.public}) is not a text channel`);

    const emoji = await guild.emojis.fetch(emojis.enter);
    if (!emoji) throw new Error(`Emoji (${emojis.enter}) not found`);

    await channel.send(`${emoji}   ${member} has joined the server.`);
  },
} as IEvent<'guildMemberAdd'>;
