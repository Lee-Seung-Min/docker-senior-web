import {writable, get} from "svelte/store";
import {adminUrlAddr} from "$lib/js/urlAddr.js";
import {getAPI} from "$lib/js/getAPI.js";
import {postAPI} from "$lib/js/postAPI.js";
import {makeStr} from "$lib/js/makeStr.js";

let smartropay;



export const useSmartroPay = (() => {
    const isLoading = writable(false);
    // PG 결제정보
    const payInfo = writable({});
    // 결제수단 관리
    const plstList = writable([]);  // 결제수단 리스트
    const originPlstList = writable([]);  // 결제수단 리스트

    // 과세 및 비과세 직접 계산 방식
    let TaxFreeAmt = 0; // 비과세
    let VatAmt; // 부가세
    let TaxAmt; // 과세


    // [일반, 빌키] 스마트로 결제 세팅
    async function initPayment(amt, mpayId, loginMbrId, dgnsInfo, userType) {
        isLoading.set(true);
        // cdn import
        await initCdn();
        // 과세 설정
        taxCalc(amt, TaxFreeAmt);
        // 간편결제 카드리스트 가져오기
        loadPlstList();

        let jsonStr = makeStr({amt, mpayId});
        const url = adminUrlAddr + "/v1/smartroPay/initStandardPayment";
        const res = await postAPI(url, jsonStr);

        payInfo.update(value => {
            const updatedValue = {
                ...res.resultVO, // 기존 응답 데이터 유지
                amt: parseInt(res.resultVO.amt),
                PayMethod: "CARD",
                GoodsCnt: "1",
                GoodsName: "비대면진료비",
                Moid: new Date().YYMMDDHHMMSS() + pad(loginMbrId, 10) + pad(dgnsInfo.mpayId, 10),
                ReturnUrl: adminUrlAddr + "/v1/smartroPay/ext/pym",
                StopUrl: adminUrlAddr + `/v1/smartroPay/ext/pymFld?mpayId=${dgnsInfo.mpayId}&userType=${userType}`,
                BuyerName: dgnsInfo.mbrName,
                BuyerTel: dgnsInfo.mdtlTel.replace(/\-/g, ""),
                BuyerEmail: "",
                VbankExpDate: "",
                GoodsCl: "0",
                TaxAmt: TaxAmt,
                TaxFreeAmt: TaxFreeAmt,
                VatAmt: VatAmt,
                MallUserId: loginMbrId
            };
            // 결제 폼 생성 호출
            createPaymentForm(updatedValue);
            return updatedValue;
        });

        isLoading.set(false);
    }

    // 일반결제
    async function goPayToStd() {
        isLoading.set(true);

        // 스마트로페이 결제 요청을 Promise로 감싸서 실행 완료를 보장
        function payment() {
            return new Promise((resolve, reject) => {
                // 스마트로페이 초기화
                smartropay.init({
                    mode: import.meta.env.VITE_SMARTRO_SET, // STG: 테스트, REAL: 운영(운영서버 전환 시 변경 필수!)
                });

                // 스마트로페이 결제 요청
                smartropay.payment({
                    FormId: "tranMgr", // 폼ID
                    Callback: async function (res) {
                        if (!res.Tid || !res.TrAuthKey) {
                            reject(new Error("결제 승인 정보가 없습니다."));
                            return;
                        }

                        try {
                            const tmpPayInfo = get(payInfo);
                            const url = tmpPayInfo.ReturnUrl;

                            const result = await fetch(url, {
                                method: "POST",
                                headers: { "content-type": "application/x-www-form-urlencoded" },
                                body: new URLSearchParams({
                                    Tid: res.Tid,
                                    TrAuthKey: res.TrAuthKey,
                                }),
                            });

                            if (!result.ok) {
                                throw new Error("결제 승인 요청 실패");
                            }

                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    },
                });
            });
        }

        try {
            await payReqLogSave(); // 결제 요청 로그 저장
            const response = await payment(); // 스마트로페이 결제 요청 후 응답 대기
            // console.log("결제 성공:", response);
        } catch (error) {
            console.error("결제 실패:", error);
        } finally {
            isLoading.set(false);
        }
    }

    // 빌링결제 (간편결제)
    async function goPayToBln(plstId) {
        isLoading.set(true);
        const selectedPlstInfo = get(originPlstList).find((item)=>(item.plstId === plstId))
        console.log(selectedPlstInfo)

        const tmpPayInfo = get(payInfo)
        const jsonStr = JSON.stringify({
            payMethod: tmpPayInfo.PayMethod,
            goodsCnt: tmpPayInfo.GoodsCnt,
            goodsName: tmpPayInfo.GoodsName,
            amt: tmpPayInfo.amt,
            moid: tmpPayInfo.Moid,
            mallUserId: selectedPlstInfo.plstMbrId,
            // mid: selectedPlstInfo.plstMid,
            billTokenKey: selectedPlstInfo.plstBlnTkn,
            buyerName: tmpPayInfo.BuyerName,
            buyerTel: tmpPayInfo.BuyerTel,
            buyerEmail: tmpPayInfo.BuyerEmail,
            cardQuota: "00",
            verifyValue: "",
            taxAmt: tmpPayInfo.TaxAmt,
            taxFreeAmt: payInfo.TaxFreeAmt,
            vatAmt: tmpPayInfo.VatAmt,
            // merchantKey: payInfo.merchantKey,
        });
        const url = adminUrlAddr + "/v1/smartroPay/blnPym";
        await postAPI(url, jsonStr)
        isLoading.set(false);
    }



    /** etc **/


    // 과세 계산식
    function taxCalc(amt, TaxFreeAmt) {
        if (TaxFreeAmt > amt) TaxFreeAmt = amt;
        let tmp = (amt - TaxFreeAmt) / 1.1;
        VatAmt = Math.floor(amt - tmp - TaxFreeAmt);
        TaxAmt = amt - VatAmt - TaxFreeAmt;
    }

    // 결제요청 전 로그 저장
    async function payReqLogSave() {
        const jsonStr = JSON.stringify(get(payInfo));
        const url = adminUrlAddr + "/v1/smartroPay/payReqLog";
        await postAPI(url, jsonStr);
    }

    // 결제수단 리스트 가져오기
    async function loadPlstList() {
        let url = adminUrlAddr + "/v1/smartroPay/uaMbrCrdLst";
        const res = await getAPI(url);
        try {
            const dataList = res.resultVO;
            originPlstList.set(dataList);
            const mapList = dataList.map((item)=> ({
                id: item.plstId,
                cardNm: item.plstCardNm,
                cardNo: item.plstCardNo,
            }))
            plstList.set(mapList);
        } catch (error) {
            console.error("Error loadPlstList:", error);
        }
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

Date.prototype.YYMMDDHHMMSS = function () {
    let yy = this.getFullYear().toString().substring(2, 4);
    let MM = pad(this.getMonth() + 1, 2);
    let dd = pad(this.getDate(), 2);
    let hh = pad(this.getHours(), 2);
    let mm = pad(this.getMinutes(), 2);
    let ss = pad(this.getSeconds(), 2);

    return yy + MM + dd + hh + mm + ss;
};

function pad(number, length) {
    let str = "" + number;
    while (str.length < length) {
        str = "0" + str;
    }
    return str;
}

async function initCdn() {
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = () => resolve(window.smartropay);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    try {
        smartropay = await loadScript(import.meta.env.VITE_SMARTRO_URL_SET);
        console.log("SmartroPAY 로드 완료");
    } catch (error) {
        console.error("SmartroPAY 로드 실패", error);
    }

    // const scriptTag = document.createElement("script");
    // scriptTag.src = import.meta.env.VITE_SMARTRO_URL_SET;
    // document.head.appendChild(scriptTag);
    // scriptTag.onload = () => {
    //     if (window.smartropay) {
    //         smartropay = window.smartropay; // 전역 객체 저장
    //         console.log("SmartroPAY 로드 완료");
    //     }
    // };
}

function createPaymentForm(payInfo) {
    // 기존 폼이 있다면 삭제
    const existingForm = document.getElementById("tranMgr");
    if (existingForm) {
        existingForm.remove();
    }

    // 폼 생성
    const form = document.createElement("form");
    form.id = "tranMgr";
    form.name = "tranMgr";
    form.enctype = "application/x-www-form-urlencoded";
    form.method = "post";
    form.style.display = "none";

    // 입력 필드 추가 함수
    function addInput(name, value, placeholder = "") {
        const input = document.createElement("input");
        input.type = "text";
        input.name = name;
        input.value = value || "";
        input.placeholder = placeholder;
        form.appendChild(input);
    }

    // 필드 추가
    addInput("PayMethod", payInfo.PayMethod);
    addInput("GoodsCnt", payInfo.GoodsCnt, "최대 2자리 숫자");
    addInput("GoodsName", payInfo.GoodsName, "최대 40자");
    addInput("Amt", payInfo.amt, "결제 금액");
    addInput("Moid", payInfo.Moid, "특수문자 포함 불가");
    addInput("Mid", payInfo.mid);
    addInput("ReturnUrl", payInfo.ReturnUrl);
    addInput("StopUrl", payInfo.StopUrl, "Mobile 연동 시 필수");
    addInput("BuyerName", payInfo.BuyerName);
    addInput("BuyerTel", payInfo.BuyerTel);
    addInput("BuyerEmail", payInfo.BuyerEmail);
    addInput("VbankExpDate", payInfo.VbankExpDate, "가상계좌 이용 시 필수");
    addInput("EncryptData", payInfo.encryptData, "위/변조방지 HASH 데이터");
    addInput("GoodsCl", payInfo.GoodsCl);
    addInput("EdiDate", payInfo.ediDate);
    addInput("TaxAmt", payInfo.TaxAmt, "부가세 직접계산 가맹점 필수");
    addInput("TaxFreeAmt", payInfo.TaxFreeAmt, "부가세 직접계산 가맹점 필수");
    addInput("VatAmt", payInfo.VatAmt, "부가세 직접계산 가맹점 필수");
    addInput("MallUserId", payInfo.MallUserId, "바로닥터 결제자ID");

    // 폼을 body에 추가
    document.body.appendChild(form);
}

// 예제 데이터
const payInfo = {
    PayMethod: "CARD",
    GoodsCnt: "1",
    GoodsName: "비대면진료비",
    amt: "10000",
    Moid: "1234567890",
    Mid: "merchant123",
    ReturnUrl: "https://example.com/return",
    StopUrl: "https://example.com/stop",
    BuyerName: "홍길동",
    BuyerTel: "01012345678",
    BuyerEmail: "hong@example.com",
    VbankExpDate: "",
    EncryptData: "",
    GoodsCl: "0",
    EdiDate: "20240217",
    TaxAmt: "1000",
    TaxFreeAmt: "0",
    VatAmt: "1000",
    MallUserId: "user123"
};
