import { useEffect, useState } from "react";
import type { ParamStore } from "../engine/ParamStore";

/** Subscribe to a single param key from the store, re-rendering on change. */
export function useParam(store: ParamStore, key: string): number {
  const [value, setValue] = useState(() => store.get(key));
  useEffect(() => {
    setValue(store.get(key));
    return store.subscribe(key, setValue);
  }, [store, key]);
  return value;
}
