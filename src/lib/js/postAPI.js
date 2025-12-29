import { json } from "@sveltejs/kit";
import { postFetch } from "$lib/js/postFetch.js";
import { updateRefresh } from "$lib/js/updateRefresh.js";

/**
 * @param {RequestInfo | URL} url
 * @param {any} jsonStr
 */
async function postAPI(url, jsonStr, header = "") {
    return await postFetch(url, jsonStr, !localStorage.getItem("userJwt") ? "" : localStorage.getItem("userJwt"))
        .then(async (res) => {
            // 인증에러
            if (res.status == 401) {
                // 토큰 재발급
                await updateRefresh();
                // getApi() 재요청
                res = await postFetch(
                    url,
                    jsonStr,
                    !localStorage.getItem("userJwt") ? "" : localStorage.getItem("userJwt")
                );
            }
            if (!res.ok) {
                throw res;
            }
            return res.json();
        })
        .then((data) => {
            return data;
        })
        .catch((err) => {
            err.json().then((data) => {
                throw data;
            });
        });
}

export { postAPI };
