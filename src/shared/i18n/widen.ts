/**
 * The shape of a translation object with every string literal widened to
 * `string` — lets `en` be type-checked against the `ar` source of truth.
 */
export type Widen<T> = {
  [K in keyof T]: T[K] extends string ? string : Widen<T[K]>
}
