import { Client as BaseClient, ClientOptions } from 'discord.js';
import { EventManager } from '../managers/EventManager';

export class Client extends BaseClient<true> {
  public events: EventManager;

  constructor(options: ClientOptions) {
    super(options);

    this.events = new EventManager();
  }

  async start(token: string | undefined) {
    const env = process.env.NODE_ENV;
    const src = env === 'development' ? 'src' : 'dist';

    // Load events
    await this.events.load(`${src}/events`, {
      recursive: true,
      pattern: /\.event\.(js|ts|json)$/,
      useCategories: true,
    });

    // Login
    await this.login(token);
  }
}
