import { goto } from "$app/navigation";
import { getAPI } from "./getAPI";
import { getFetch } from "$lib/js/getFetch.js";
import { urlList } from "$lib/urlList.js";
import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";

/**
 * 리프레시 토큰으로 엑시스 토큰을 재발급하기 위한 함수
 * @param refresh
 */
async function updateRefresh(refresh = "") {
    const url = authUrlAddr + "/kakao/updateRefreshToken";
    const refreshJwt = !localStorage.getItem("refreshJwt") ? null : localStorage.getItem("refreshJwt");
    if (refreshJwt == "guest") {
        goto(urlList.uaSessionExpire);
    } else {
        await getFetch(url, refreshJwt)
            .then((res) => {
                console.log("updateRefresh : ", res);
                if (res.ok == false) return goto(urlList.uaLogin);
                return res.json();
            })
            .then((data) => {
                if (data.status === 22005) return goto(urlList.uaLogin);
                localStorage.setItem("userJwt", data.accessToken);
                if (window.AndroidBridge && typeof window.AndroidBridge.updateToken === 'function') {
                    window.AndroidBridge.updateToken(data.accessToken);
                }
            });
    }
}

export { updateRefresh };
