import { browser } from "$app/environment";
import { writable } from "svelte/store";

const login = (key) => {
  if (browser) {
    const loginSession = sessionStorage.getItem(key);
    const store = writable(loginSession != null ? loginSession : false);
    store.subscribe((val) => {
      sessionStorage.setItem(key, val);
    });
    return store;
  }
};

export const isLogin = login("isLogin");
