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

export const dlName = persist_storage("dlName", "");
export const dlTel = persist_storage("dlTel", "");
export const dlZip = persist_storage("dlZip", "");
export const dlAddr = persist_storage("dlAddr", "");
export const dlAddrDtl = persist_storage("dlAddrDtl", "");
export const drcpPspnId = persist_storage("drcpPspnId", "");
export const drcpShpId = persist_storage("drcpShpId", "");
