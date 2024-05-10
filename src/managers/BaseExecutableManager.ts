import { BaseManager, BaseManagerOptions } from './BaseManager';
import type { Callback, CallbackParams } from '../types';
import { BaseExecutable, IBaseExecutable } from './BaseExecutable';

/**
 * The base executable manager options.
 */
export interface BaseExecutableManagerOptions extends BaseManagerOptions {
  /**
   * The beforeAll callback.
   * @default null
   */
  beforeAll?: Callback<Record<string, never>> | null;

  /**
   * The afterAll callback.
   * @default null
   */
  afterAll?: Callback<Record<string, never>> | null;
}

/**
 * The base executable manager.
 * @template B Base executable type.
 */
export abstract class BaseExecutableManager<B extends BaseExecutable, I extends IBaseExecutable> extends BaseManager<
  B,
  I
> {
  constructor(protected override options: BaseExecutableManagerOptions = {}) {
    super(options);
  }

  /**
   * Creates a new builder.
   * @param item
   * @returns
   */
  override from(item: IBaseExecutable | BaseExecutable) {
    return (item instanceof BaseExecutable ? item : new BaseExecutable(item)) as B;
  }

  /**
   * Call an item.
   * @param item The item to call.
   * @param params The parameters for the callback.
   * @example
   * await manager.call('ping', { client });
   * await manager.call(ping, { client });
   * @throws { Error } Item not found.
   * @throws { Error } Item not enabled.
   * @throws { Error } Item execute not found.
   */
  async call(item: B | string, params: CallbackParams<Record<string, never>>) {
    const i = typeof item === 'string' ? this.cache.get(item) : item;
    if (!i) throw new Error('Item not found');
    if (!i.enabled) throw new Error('Item not enabled');
    if (!i.execute) throw new Error('Item execute not found');

    await this.options.beforeAll?.(params);
    const response = await i.call(params);
    await this.options.afterAll?.(params);

    return response;
  }
}
