import { Collection } from 'discord.js';
import { Explorer, File, Folder } from '@natchy/utils';
import { Base, type IBase } from './Base';

/**
 * The base manager options.
 */
export interface BaseManagerOptions {
  /**
   * Whether to disable all items by default.
   * @default false
   */
  disableAllByDefault?: boolean | null;
}

/**
 * The base manager load method options.
 */
export interface BaseManagerLoadOptions {
  /**
   * Whether to load recursively, searching for items in subfolders.
   * @default false
   */
  recursive?: boolean | null;

  /**
   * The maximum depth to search for items.
   * @default null
   */
  maxDepth?: number | null;

  /**
   * The pattern to search for items.
   * @default /\.(js|ts|json)$/
   */
  pattern?: RegExp | null;

  /**
   * Whether to use categories, searching for items in root folders and setting the category property.
   * @default false
   */
  useCategories?: boolean | null;
}

/**
 * The base manager.
 * @template B Base type.
 */
export abstract class BaseManager<B extends Base, I extends IBase> {
  cache = new Collection<string, B>();

  constructor(protected options: BaseManagerOptions = {}) {}

  /**
   * Adds an item to the cache.
   * @param item The item to add.
   * @returns The added item.
   * @example
   * manager.add({
   *  name: 'ping',
   *  description: 'Ping command',
   *  enabled: true,
   *  execute: async ({ client }) => {
   *    await client.reply('Pong!');
   *  },
   * });
   */
  add(item: B | I): void {
    const i = item instanceof Base ? item : this.from(item);
    if (this.options.disableAllByDefault && i.enabled) i.disable();
    this.cache.set(i.name, i);
  }

  /**
   * Removes an item from the cache.
   * @param item The item to remove.
   * @example
   * manager.remove('ping');
   * manager.remove(ping);
   * manager.remove(ping.name);
   */
  remove(item: B | I | string): void {
    if (typeof item === 'string') this.cache.delete(item);
    else this.cache.delete(item.name);
  }

  /**
   * Clears the cache.
   * @example
   * manager.clear();
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Creates a new builder.
   * @param item
   * @returns
   */
  from(item: IBase | Base) {
    return (item instanceof Base ? item : new Base(item)) as B;
  }

  /**
   * Finds an item in the cache.
   * @param name The name of the item.
   * @returns The found item.
   * @example
   * await manager.find('ping');
   * await manager.find(ping);
   * await manager.find(ping.name);
   * @throws { Error } File not found.
   * @throws { Error } Not a file.
   * @throws { Error } Not a JavaScript or TypeScript file.
   * @throws { Error } Item not found in file.
   */
  async fetch(to: string, prop = 'default') {
    if (!Explorer.exists(to)) throw new Error('File not found');
    const file = Explorer.from(to);

    if (!file) throw new Error('File not found');
    if (file.type !== 'file') throw new Error('Not a file');

    const item = (await Explorer.import(file.path, prop)) as B | I;
    if (!item) throw new Error('Item not found in file');

    item.path = file.path;
    return item;
  }

  /**
   * Refresh an item.
   * @param item The item to refresh.
   * @example
   * await manager.refresh('ping');
   * @throws { Error } Item not found.
   * @throws { Error } Item path not found.
   */
  async refresh(item: B | string): Promise<B> {
    const i = typeof item === 'string' ? this.cache.get(item) : item;
    if (!i) throw new Error('Item not found');
    if (!i.path) throw new Error('Item path not found');

    return i.refresh();
  }

  /**
   * Enable an item.
   * @param item The item to enable.
   * @returns The enabled item.
   * @example
   * manager.enable('ping');
   * manager.enable(ping);
   * manager.enable(ping.name);
   * @throws { Error } Item not found.
   */
  enable(item: B | string): B {
    const i = typeof item === 'string' ? this.cache.get(item) : item;
    if (!i) throw new Error('Item not found');

    i.enable();
    return i;
  }

  /**
   * Disable an item.
   * @param item The item to disable.
   * @returns The disabled item.
   * @example
   * manager.disable('ping');
   * manager.disable(ping);
   * manager.disable(ping.name);
   * @throws { Error } Item not found.
   */
  disable(item: B | string): B {
    const i = typeof item === 'string' ? this.cache.get(item) : item;
    if (!i) throw new Error('Item not found');

    i.disable();
    return i;
  }

  /**
   * Load an item.
   * @param to The path to the item.
   * @param options The options.
   * @example
   * await manager.load('commands');
   * @throws { Error } Path not found.
   */
  async load(to: string, options: BaseManagerLoadOptions = {}) {
    if (!to) throw new Error('Path not found');
    const t = Explorer.absolute(to);

    const { recursive = false, maxDepth = null, pattern = /\.(js|ts|json)$/, useCategories = false } = options;
    const params = { type: 'file', pattern, recursive, maxDepth };

    const callback = async (file: File, category?: Folder | null) => {
      const item = await this.fetch(file.path);
      if (!item) return;

      item.loadedAt = Date.now();
      if (category) item.category = category.name;
      const builder = this.from(item) as B;

      this.add(builder);
    };

    if (useCategories) {
      const folders = Explorer.list(t, { type: 'folder' });

      await Promise.all(
        folders.map(async (folder) => {
          const files = Explorer.list(folder.path, params as never);
          await Promise.all(files.map((file) => callback(file as File, folder as Folder)));
        })
      );
    } else {
      const files = Explorer.list(t, params as never);
      await Promise.all(files.map((file) => callback(file as File)));
    }
  }
}
