import { client } from './client';
import dotenv from 'dotenv';

dotenv.config();

client.start(process.env.DISCORD_TOKEN);
