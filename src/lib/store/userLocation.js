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
//병원 검색 목록에서 사용자 현재 위치 인지
export const listUserLocation = persist_storage("listUserLocation", true);
//지도에서 사용자 현재 위치인지
export const mapUserLocation = persist_storage("mapUserLocation", true);
