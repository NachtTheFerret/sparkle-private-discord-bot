import type { ClientEvents } from 'discord.js';
import type { BaseManagerLoadOptions } from './BaseManager';
import { IEvent, Event } from './Event';
import { BaseExecutableManager } from './BaseExecutableManager';

type EventKey = keyof ClientEvents;
type EventParams<E extends EventKey> = ClientEvents[E];

export class EventManager extends BaseExecutableManager<Event<EventKey>, IEvent<EventKey>> {
  async emit(event: string | Event<EventKey>, ...args: EventParams<EventKey> | []) {
    const e = typeof event === 'string' ? this.cache.get(event) : event;
    if (!e) throw new Error('Event not found');
    return e.emit(...args);
  }

  listen(event: string | Event<EventKey>) {
    const e = typeof event === 'string' ? this.cache.get(event) : event;
    if (!e) throw new Error('Event not found');
    return e.listen();
  }

  mute(event: string | Event<EventKey>) {
    const e = typeof event === 'string' ? this.cache.get(event) : event;
    if (!e) throw new Error('Event not found');
    return e.mute();
  }

  override from(item: IEvent<EventKey> | Event<EventKey>) {
    return item instanceof Event ? item : new Event(item);
  }

  override async load(to: string, options: BaseManagerLoadOptions = {}) {
    await super.load(to, options);

    const actives = this.cache.filter((e) => e.enabled);
    await Promise.all(actives.map((e) => e.listen()));
  }
}
