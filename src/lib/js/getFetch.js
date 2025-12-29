import { json } from "@sveltejs/kit";

/**
 * get 방식으로 데이터를 가져오는 함수
 * @param {RequestInfo | URL} url
 */
async function getFetch(url, header = "") {
  return await fetch(url, {
    method: "GET",
    // credentials: "include",
    headers: {
      "bizportal-access-token": header,
    },
  });
}

export { getFetch };
