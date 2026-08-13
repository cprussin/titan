/**
 * A value that is either still loading or fully resolved.
 *
 * The prop is threaded down a component tree so one template renders both the
 * loading and the loaded state: every leaf that shows a value reads it from
 * here, standing in a skeleton while `isLoading` is `true`. Because the
 * structure is written once and only the leaves diverge, the loading placeholder
 * cannot drift out of sync with the loaded view.
 */
export type Loadable<T> =
  | { readonly isLoading: true }
  | { readonly isLoading: false; readonly value: T };

/**
 * Narrow a loadable to a slice of its resolved value, threading the loading
 * state through unchanged. Used to hand each child only the part of a parent's
 * data it needs, so a component's props stay minimal in both states.
 */
export const mapLoadable = <T, U>(
  loadable: Loadable<T>,
  select: (value: T) => U,
): Loadable<U> =>
  loadable.isLoading
    ? loadable
    : { isLoading: false, value: select(loadable.value) };
