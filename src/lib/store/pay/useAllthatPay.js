import {writable, get} from "svelte/store";
import {adminUrlAddr} from "$lib/js/urlAddr.js";
import {getAPI} from "$lib/js/getAPI.js";
import {postAPI} from "$lib/js/postAPI.js";
import {makeStr} from "$lib/js/makeStr.js";



export const useAllthatPay = (() => {
    const isLoading = writable(false);
    // PG 결제정보
    const payInfo = writable({});
    // 결제수단 관리
    const plstList = writable([]);  // 결제수단 리스트
    const originPlstList = writable([]);  // 결제수단 리스트

    /* 내부 변수 */
    let loginMbrId;
    let amt;
    let mpayId;



    // [일반, 빌키] 스마트로 결제 세팅
    async function initPayment(amt, mpayId, loginMbrId, dgnsInfo, userType) {
        isLoading.set(true);
        console.log("AllthatPay 로드 완료");
        this.loginMbrId = loginMbrId;
        this.amt = amt;
        this.mpayId = mpayId;


        isLoading.set(false);
    }

    // 일반결제
    async function goPayToStd() {
        isLoading.set(true);

        const jsonStr = JSON.stringify({
            loginId: this.loginMbrId,
            mpayId: this.mpayId,
            amt: this.amt,
        });
        const url = adminUrlAddr + "/v1/allthatPay/payment/standard/request";
        const res = await postAPI(url, jsonStr);

        if (res?.code === 0) {
            const payUrl = res?.resultVO?.payUrl;

            // 모바일 기기 여부 체크
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                // 모바일이면 페이지 이동
                window.location.href = payUrl;
            } else {
                // PC면 팝업 띄우기 (새 창 열기)
                await openPopupAndWait(payUrl);
            }
        } else {
            throw res;
        }

        isLoading.set(false);
    }

    // 빌링결제 (간편결제)
    async function goPayToBln(plstId) {
        isLoading.set(true);

        isLoading.set(false);
    }




    // 결제수단 리스트 가져오기
    async function loadPlstList() {

    }

    return {
        isLoading,
        payInfo,
        plstList,

        initPayment,
        goPayToStd,
        goPayToBln,
    }
})();



/** etc **/


function openPopupAndWait(url) {
    return new Promise((resolve) => {
        const popup = window.open(url, "_blank", "width=1000,height=600");

        if (!popup || popup.closed) {
            console.error("팝업이 차단되었거나 새 창에서 열리지 않았습니다!");
            resolve(false);
            return;
        }

        const interval = setInterval(() => {
            if (popup.closed) {
                clearInterval(interval);
                console.log("팝업이 닫혔습니다!");
                resolve(true);
            }
        }, 500); // 0.5초마다 감지
    });
}

async function run() {
    console.log("팝업 열림!");
    await openPopupAndWait("https://example.com");
    console.log("팝업이 닫힌 후 실행됨!");
}
