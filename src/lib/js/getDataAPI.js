import { json } from "@sveltejs/kit";

/**
 * get 방식으로 데이터를 가져오는 함수
 * @param {RequestInfo | URL} url
 */
async function getDataAPI(url, header = "") {
  let result = "";
  console.log(url);
  await fetch(url, {
    method: "GET",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.code) {
        console.log(data);
        throw new Error(data.code);
      } else {
        result = data;
      }
    });
  return result;
}
export { getDataAPI };
