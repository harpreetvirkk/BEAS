/**
 * Knuth shuffle of array elements. The supplied array is directly modified.
 * @private
 * @param {array} array An array to shuffle.
 */
export declare function shuffle(array: Array<unknown>): void;
export interface FulfilledPromiseResult<T> {
    status: 'fulfilled';
    value: T;
}
export interface RejectedPromiseResult {
    status: 'rejected';
    reason: Error;
}
export declare type SettledPromiseResult<T> = FulfilledPromiseResult<T> | RejectedPromiseResult;
/**
 * Implementation of {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled|Promise.allSettled()}
 * for use in Node versions prior to 12.9.0, where this was introduced.
 * @private
 * @param {Iterable<Promise>} promises Iterable promises.
 * @returns An array of promises.
 */
export declare function allSettled<T>(promises: Iterable<Promise<T>>): Promise<SettledPromiseResult<T>[]>;
/**
 * Wrap a function call with a cache. On first call the wrapped function is invoked to obtain a result. Subsequent
 * calls return the cached result.
 * @private
 * @param f A function whose result should be cached.
 */
export declare function cachedResult<T>(f: () => T): () => T;
/**
 * Typesafe check that a value is not nullish.
 * @private
 * @param value Any value, including null and undefined.
 */
export declare function notNullish<T>(value?: T): value is T;
