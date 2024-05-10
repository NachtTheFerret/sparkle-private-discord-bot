import type { Client } from 'discord.js';

/**
 * Parameters for the callback.
 * @template B Base type.
 * @template R Return type.
 */
type CallbackParams<P = Record<string, never>> = {
  client: Client<true>;
} & P;

/**
 * The callback.
 * @template B Base type.
 * @template R Return type.
 */
type Callback<P = Record<string, never>, R = unknown> = (params: CallbackParams<P>) => Promise<R> | R;
