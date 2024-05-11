import type { Callback, CallbackParams } from '../types';
import { Base, type IBase } from './Base';

type Where = 'before' | 'execute' | 'after';

/**
 * The base executable interface
 */
export interface IBaseExecutable<P = any> extends IBase {
  // Callbacks
  before?: Callback<P> | null;
  execute?: Callback<P> | null;
  after?: Callback<P> | null;
  error?: Callback<{ where: Where; error: Error } & P> | null;

  // Timestamps
  lastCallAt?: number | null;
  lastErroredAt?: number | null;
}

/**
 * The base executable
 * @template P Parameters type
 */
export class BaseExecutable<I extends IBaseExecutable<P>, P = any> extends Base<I> implements IBaseExecutable<P> {
  before: Callback<P> | null;
  execute: Callback<P> | null;
  after: Callback<P> | null;
  error: Callback<{ where: Where; error: Error } & P> | null;

  lastCallAt: number | null;
  lastErroredAt: number | null;

  /**
   * Creates a new builder
   * @param data Create a builder from data
   */
  constructor(data?: I) {
    super(data);

    this.before = data?.before || null;
    this.execute = data?.execute || null;
    this.after = data?.after || null;
    this.error = data?.error || null;
    this.lastCallAt = data?.lastCallAt || null;
    this.lastErroredAt = data?.lastErroredAt || null;
  }

  /**
   * Call this instance
   * @param params The parameters to call
   * @throws { Error } Item not enabled.
   * @throws { Error } Item execute not found.
   */
  async call(params: CallbackParams<P>) {
    if (!this.enabled) throw new Error('Item not enabled');
    if (!this.execute) throw new Error('Item execute not found');

    let where = 'before' as 'before' | 'execute' | 'after';

    try {
      this.lastCallAt = Date.now();
      await this.before?.(params);

      where = 'execute';
      await this.execute(params);

      where = 'after';
      await this.after?.(params);
    } catch (error) {
      this.lastErroredAt = Date.now();
      const err = error as Error;
      await this.error?.({ ...params, where, error: err } as never);
    }
  }

  // setters
  setBefore(before: Callback<P>) {
    this.before = before;
    return this;
  }

  setExecute(execute: Callback<P>) {
    this.execute = execute;
    return this;
  }

  setAfter(after: Callback<P>) {
    this.after = after;
    return this;
  }

  setError(error: Callback<{ where: Where; error: Error } & P>) {
    this.error = error;
    return this;
  }
}
