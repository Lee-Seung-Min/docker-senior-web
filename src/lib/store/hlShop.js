import { browser } from "$app/environment";
import { writable } from "svelte/store";

const persist_storage = (key, initValue) => {
  if (browser) {
    const storedValueStr = sessionStorage.getItem(key);
    const store = writable(storedValueStr != null ? JSON.parse(storedValueStr) : initValue);
    store.subscribe((val) => {
      sessionStorage.setItem(key, JSON.stringify(val));
    });
    return store;
  }
};
export const hlShop = persist_storage("hlShop", "");
