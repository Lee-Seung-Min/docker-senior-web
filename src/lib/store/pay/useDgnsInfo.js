import { writable, get } from "svelte/store";
import { postAPI } from "$lib/js/postAPI.js";
import { makeStr } from "$lib/js/makeStr.js";
import { adminUrlAddr } from "$lib/js/urlAddr.js";
import {decrypt} from "$lib/js/aes256.js";

// // 개별적인 `writable` 상태 유지
// const dgnsInfo = writable(null);
// const pgReg = writable(false);
// const hsptBank = writable([]);
// const hsptBankNull = writable(true);
// const amt = writable("0");
// const mpayId = writable("0");
// const pgClient = writable(null);

// `writable`을 감싸서 `subscribe()` 추가 (반응형 유지)
export const useDgnsInfo = (() => {
// 개별적인 `writable` 상태 유지
    const dgnsInfo = writable(null);
    const pgReg = writable(false);
    const hsptBank = writable([]);
    const hsptBankNull = writable(true);
    const amt = writable("0");
    const mpayId = writable("0");
    const pgType = writable(null);
    const moduleList = writable([]);

    // 결제 정보 가져오기
    async function initDgnsInfo(dgnsId, jwt) {
        let jsonStr = makeStr({ dgnsId });
        const url = adminUrlAddr + "/v1/mpay/selectMobileDgnsPayinfo";

        try {
            const res = await postAPI(url, jsonStr, jwt);
            dgnsInfo.set(res.resultVO);
            amt.set(res.resultVO?.dgnsPay);
            mpayId.set(res.resultVO?.mpayId?.toString());
        } catch (error) {
            console.error("Error fetching Dgns Pay Info:", error);
        }
    };

    // 결제 여부 확인
    async function isPayValidation(jwt) {
        let jsonStr = makeStr({ mpayId: get(mpayId) });
        const url = adminUrlAddr + "/v1/mpay/pymVali";

        try {
            const res = await postAPI(url, jsonStr, jwt);
            if (res.code !== 0) {
                throw res;
            }
        } catch (error) {
            console.error("Payment validation error:", error);
        }
    };

    //결제 환경 찾기
    async function getPayEnv() {
        await getPayModule();
    }

    // PG 체크
    async function getPayModule() {
        let jsonStr = makeStr({ mpayId: get(mpayId) });
        const url = adminUrlAddr + "/v1/mpay/selectPgModule";

        try {
            const res = await postAPI(url, jsonStr);

            pgReg.update(value => {
                value = res.resultVO?.pgType != null;
                if (!value) {
                    getHsptBankInfo(mpayId);
                } else {
                    pgType.set(res.resultVO?.pgType);
                    moduleList.set(res.resultVO?.pgKeyList.map(pgKey => pgKey.spgMdlType));
                }
                return value;
            });
        } catch (error) {
            console.error("Error fetching PG Register:", error);
        }
    }

    // 병원 계좌 정보 가져오기
    async function getHsptBankInfo(mpayId) {
        let jsonStr = makeStr({ mpayId: get(mpayId) });
        const url = adminUrlAddr + "/v1/mpay/selectHsptBank";

        try {
            const res = await postAPI(url, jsonStr);
            hsptBank.set(res.resultVO);

            const tmpHsptBank = get(hsptBank);
            if (tmpHsptBank?.sdtlBank && tmpHsptBank?.sdtlBankNum) {
                hsptBankNull.set(false);
                hsptBank.update(bank => ({
                    ...bank,
                    sdtlBankNum: decrypt(tmpHsptBank.sdtlBankNum)
                }));
            }
        } catch (error) {
            console.error("Error fetching hospital bank info:", error);
        }
    }

    return {
        dgnsInfo,
        pgReg,
        hsptBank,
        hsptBankNull,
        amt,
        mpayId,
        pgType,
        moduleList,

        initDgnsInfo,
        isPayValidation,
        getPayEnv,

    };
})();

// `useDgnsInfo`를 `writable`로 감싸서 `$useDgnsInfo`로 사용 가능하게 함
// export const useDgnsInfo = createDgnsStore();
