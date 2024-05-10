import type { IEvent } from '../../managers/Event';

export default {
  name: 'ready:log',

  execute: ({ client }) => {
    console.log();
    console.log('➡️  ', `Logged in as ${client.user?.tag}`);

    // client.emit(
    //   'guildMemberAdd',
    //   client.guilds.cache.get('1236357886335254639')!.members.cache.get('1031989058051784814')!
    // );
  },
} as IEvent<'ready'>;
