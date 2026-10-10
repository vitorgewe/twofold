import { useEffect, useState } from 'react';

import { subscribeToDataChanges } from './changes';

export type QueryState<T> = {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
};

type Settled<T> = QueryState<T> & { deps: readonly unknown[] };

const sameDeps = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((dep, i) => Object.is(dep, b[i]));

/**
 * Runs `query` and runs it again whenever a repository write notifies a change or `deps` change.
 * A change in `deps` drops the old result, so a screen never shows data for the previous inputs;
 * a write notification keeps the current result on screen while it refreshes.
 */
export function useQuery<T>(query: () => Promise<T>, deps: readonly unknown[] = []): QueryState<T> {
  const [state, setState] = useState<Settled<T>>({ data: undefined, error: undefined, loading: true, deps });

  useEffect(() => {
    let run = 0;

    const load = () => {
      const current = ++run;
      query().then(
        (data) => {
          if (current === run) setState({ data, error: undefined, loading: false, deps });
        },
        (error: unknown) => {
          if (current === run) {
            setState((previous) => ({
              data: sameDeps(previous.deps, deps) ? previous.data : undefined,
              deps,
              error: error instanceof Error ? error : new Error(String(error)),
              loading: false,
            }));
          }
        },
      );
    };

    load();
    const unsubscribe = subscribeToDataChanges(load);
    return () => {
      run++; // results of queries still in flight are ignored
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller lists what the query depends on
  }, deps);

  return sameDeps(state.deps, deps) ? state : { data: undefined, error: undefined, loading: true };
}
