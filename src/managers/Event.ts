import type { ClientEvents } from 'discord.js';
import { client } from '../client';
import { BaseExecutable, type IBaseExecutable } from './BaseExecutable';

type EventKey = keyof ClientEvents;
type EventParams<E extends EventKey> = ClientEvents[E];

export interface IEvent<E extends EventKey> extends IBaseExecutable<{ event: E; args: EventParams<E> }> {
  emitOnReady?: boolean | null;
  lastEmittedAt?: number | null;
}

export class Event<E extends EventKey> extends BaseExecutable<{ event: E; args: EventParams<E> }> implements IEvent<E> {
  emitOnReady: boolean | null;
  lastEmittedAt: number | null;

  constructor(data?: IEvent<E>) {
    super(data);
    this.emitOnReady = data?.emitOnReady ?? null;
    this.lastEmittedAt = data?.lastEmittedAt ?? null;

    if (this.emitOnReady) client.once('ready', () => this.emit());
  }

  emit(...args: EventParams<E> | []) {
    this.lastEmittedAt = Date.now();
    return this.call({ event: this.category as E, args: (args || []) as EventParams<E>, client });
  }

  listen() {
    client.on(this.category as string, (...args: EventParams<E>) => {
      this.call({ event: this.category as E, args, client });
    });
  }

  mute() {
    client.off(this.category as string, (...args: EventParams<E>) => {
      this.call({ event: this.category as E, args, client });
    });
  }
}
