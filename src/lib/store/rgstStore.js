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

export const treat_target = persist_storage("treat_target", "");
export const treat_hspt = persist_storage("treat_hspt", "");
export const treat_dept = persist_storage("treat_dept", "");
export const treat_item = persist_storage("treat_item", "");
export const treat_dtr = persist_storage("treat_dtr", "");
export const dgnsShpId = persist_storage("dgnsShpId", "");
export const dgnsDtrId = persist_storage("dgnsDtrId", "");
export const dgnsMemo = persist_storage("dgnsMemo", "");
export const dgnsRsvDttm = persist_storage("dgnsRsvDttm", "");
export const dgnsDeptId = persist_storage("dgnsDeptId", "");
export const dgnsItemId = persist_storage("dgnsItemId", "");
export const dgnsPatId = persist_storage("dgnsPatId", "");
export const dgnsType = persist_storage("dgnsType", "");
export const treat_deptNo = persist_storage("treat_deptNo", "");
export const treat_itemNo = persist_storage("treat_itemNo", "");
export const treat_dtrNo = persist_storage("treat_dtrNo", "");
export const childMount = persist_storage("childMount", false);
export const wlkYon = persist_storage("wlkYon", "");
