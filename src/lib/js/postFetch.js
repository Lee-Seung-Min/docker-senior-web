import { json } from "@sveltejs/kit";
/**
 * @param {RequestInfo | URL} url
 * @param {any} jsonStr
 */
async function postFetch(url, jsonStr, header = "") {
  return await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "bizportal-access-token": header
    },
    body: jsonStr
  });
}
export { postFetch };
