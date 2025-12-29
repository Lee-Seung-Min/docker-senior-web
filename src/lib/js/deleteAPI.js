import { json } from "@sveltejs/kit";
/**
 * @param {RequestInfo | URL} url
 * @param {any} jsonStr
 */
async function deleteAPI(url, jsonStr, header = "") {
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      "bizportal-access-token": header,
    },
    body: jsonStr,
  });

  let resData = res.json();
  if (res.ok) {
    return resData;
  } else {
    throw new Error("error");
  }
}
export { deleteAPI };
