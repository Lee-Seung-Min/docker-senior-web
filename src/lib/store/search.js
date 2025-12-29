import { writable } from "svelte/store";
import { browser } from "$app/environment";

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

export const searchType = persist_storage("searchType", "");
export const searchDept = persist_storage("searchDept", "");
export const searchItem = persist_storage("searchItem", "");
export const searchData = persist_storage("searchData", "");
export const searchWhat = persist_storage("searchWhat", "");
export const searchMount = writable(false);
export const searchLat = persist_storage("searchLat", "");
export const searchLon = persist_storage("searchLon", "");
export const location = persist_storage("location", "");
export const firstLocation = persist_storage("firstLocation", "");
export const secondLocation = persist_storage("secondLocation", "");
export const hospitalLati = persist_storage("hospitalLati", "");
export const hospitalLongi = persist_storage("hospitalLongi", "");
