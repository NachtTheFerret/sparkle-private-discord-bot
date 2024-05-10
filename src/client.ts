import { IntentsBitField } from 'discord.js';
import { Client } from './services/Client';

export const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages],
});
