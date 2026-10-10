type Listener = () => void;

const listeners = new Set<Listener>();

/** Tells every subscribed query that stored data may have changed. Called by every repository write. */
export function notifyDataChanged(): void {
  for (const listener of [...listeners]) listener();
}

/** Registers a listener for data changes and returns the function that removes it. */
export function subscribeToDataChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
