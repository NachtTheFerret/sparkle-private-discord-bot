import type { IEvent } from '../../managers/Event';

export default {
  name: 'messageCreate:blockUnauthorizedMessageContent',

  execute: async ({ args: [message], client }) => {
    const content = message.content.toLowerCase();
  },
} as IEvent<'messageCreate'>;
