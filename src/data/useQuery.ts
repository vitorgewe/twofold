import { useEffect, useState } from 'react';

import { subscribeToDataChanges } from './changes';

export type QueryState<T> = {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
};

/** Runs `query` and runs it again whenever a repository write notifies a change or `deps` change. */
export function useQuery<T>(query: () => Promise<T>, deps: readonly unknown[] = []): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ data: undefined, error: undefined, loading: true });

  useEffect(() => {
    let active = true;
    let run = 0;

    const load = () => {
      const current = ++run;
      query().then(
        (data) => {
          if (active && current === run) setState({ data, error: undefined, loading: false });
        },
        (error: unknown) => {
          if (active && current === run) {
            setState((previous) => ({
              data: previous.data,
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
      active = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller lists what the query depends on
  }, deps);

  return state;
}
