import { Explorer } from '@natchy/utils';

/**
 * The base interface
 */
export interface IBase {
  // Metadata
  name: string;
  description?: string | null;
  tags?: string[] | null;
  category?: string | null;

  // States
  enabled?: boolean | null;

  // Timestamps
  loadedAt?: number | null;
  lastRefreshedAt?: number | null;
  lastDisabledAt?: number | null;
  lastEnabledAt?: number | null;

  // System properties
  path?: string | null;
}

/**
 * The base
 * @template P Parameters type
 */
export class Base<I extends IBase> implements IBase {
  name: string;
  description: string | null;
  tags: string[] | null;
  category: string | null;

  enabled: boolean | null;

  loadedAt: number | null;
  lastRefreshedAt: number | null;
  lastDisabledAt: number | null;
  lastEnabledAt: number | null;

  path: string | null;

  /**
   * Creates a new builder
   * @param data Create a builder from data
   */
  constructor(data?: I) {
    this.name = data?.name || '';
    this.description = data?.description || null;
    this.tags = data?.tags || null;
    this.category = data?.category || null;

    this.enabled = data?.enabled ?? true;

    this.loadedAt = data?.loadedAt || null;
    this.lastRefreshedAt = data?.lastRefreshedAt || null;
    this.lastDisabledAt = data?.lastDisabledAt || null;
    this.lastEnabledAt = data?.lastEnabledAt || null;

    this.path = data?.path || null;
  }

  /**
   * Fetches an item from a path
   * @param to The path to fetch
   * @param prop The property to fetch
   * @throws { Error } Path not found.
   * @throws { Error } File not found.
   * @throws { Error } Not a file.
   * @throws { Error } Not a JavaScript or TypeScript file.
   * @throws { Error } Item not found in file.
   */
  async fetch(to = this.path, prop = 'default') {
    if (!to) throw new Error('Path not found');
    if (!Explorer.exists(to)) throw new Error('File not found');
    const file = Explorer.from(to);

    if (!file) throw new Error('File not found');
    if (file.type !== 'file') throw new Error('Not a file');
    if (file.extension !== 'js' && file.extension !== 'ts') throw new Error('Not a JavaScript or TypeScript file');

    const item = (await Explorer.import(file.path, prop)) as I | Base<I>;
    if (!item) throw new Error('Item not found in file');

    item.path = file.path;
    return item;
  }

  /**
   * Refresh this instance
   * @throws { Error } Item not found.
   * @throws { Error } Item path not found.
   */
  async refresh() {
    if (!this.path) throw new Error('Item path not found');

    const refreshed = await this.fetch(this.path);
    if (!refreshed) throw new Error('Item not found');

    this.name = refreshed.name;
    this.description = refreshed.description || null;
    this.tags = refreshed.tags || null;
    this.enabled = refreshed.enabled || null;
    this.lastRefreshedAt = Date.now();
    this.path = refreshed.path || null;

    return this;
  }

  // setters
  setName(name: string) {
    this.name = name;
    return this;
  }

  setDescription(description: string) {
    this.description = description;
    return this;
  }

  setTags(tags: string[] | null) {
    this.tags = tags;
    return this;
  }

  addTag(tag: string) {
    this.tags?.push(tag);
    return this;
  }

  removeTag(tag: string) {
    this.tags = this.tags?.filter((t) => t !== tag) || null;
    return this;
  }

  enable() {
    this.enabled = true;
    this.lastEnabledAt = Date.now();
    return this;
  }

  disable() {
    this.enabled = false;
    this.lastDisabledAt = Date.now();
    return this;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.lastEnabledAt = Date.now();
    else this.lastDisabledAt = Date.now();
    return this;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) this.lastEnabledAt = Date.now();
    else this.lastDisabledAt = Date.now();
    return this;
  }

  // other things
  get data(): I {
    return JSON.parse(JSON.stringify(this));
  }
}
