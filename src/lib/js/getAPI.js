import { json } from "@sveltejs/kit";
import { getFetch } from "$lib/js/getFetch.js";
import { updateRefresh } from "$lib/js/updateRefresh.js";
import { urlList } from "$lib/urlList.js";
import { goto } from "$app/navigation";

/**
 * get 방식으로 데이터를 가져오는 함수
 * @param {RequestInfo | URL} url
 */
async function getAPI(url, header = "") {
    return await getFetch(url, !localStorage.getItem("userJwt") ? "" : localStorage.getItem("userJwt"))
        .then(async (res) => {
            // 인증에러
            if (res.status == 401) {
                // 토큰 재발급
                await updateRefresh();
                // getApi() 재요청
                res = await getFetch(url, !localStorage.getItem("userJwt") ? "" : localStorage.getItem("userJwt"));
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

export { getAPI };
