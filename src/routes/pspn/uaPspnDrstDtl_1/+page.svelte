<script>
    // @ts-nocheck

    import { onMount } from "svelte";
    import PopUp from "$lib/sub/nav/PopUp.svelte";
    import Nav from "$lib/sub/nav/Nav.svelte";
    import { goto } from "$app/navigation";
    import { getAPI } from "$lib/js/getAPI";
    import { page } from "$app/stores";
    import { footCheck } from "$lib/store/navStore.js";
    import { shopUrlAddr, authUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
    import { getUserId } from "$lib/js/getUserId";
    import { getDow } from "$lib/js/dateFunction";
    import { pharmacyData } from "$lib/store/pharmacyData";
    import { getCall, goMap } from "$lib/js/phoneAction";
    import { addMapScript, makeDtlMap } from "$lib/js/mapFunction";
    import { drcpPspnId } from "$lib/store/pspnStore";
    import { isLogin } from "$lib/store/loginStore";
    import { updateRefresh } from "$lib/js/updateRefresh";
    import { getFetch } from "$lib/js/getFetch";
    import PageLoader from "$lib/sub/PageLoader.svelte";
    import { urlList } from "$lib/urlList";

    let faxState = false;
    let isLoading = false;
    let shpDtl = $pharmacyData;
    let jwt;
    let popUp = false;
    let dow;
    let todayTime = "";
    let faxPopUp = false;
    // 전화번호 입력 팝업 상태
    let faxNum = ""; // 화면에 표시(하이픈 포함)
    let phoneError = "";
    let mbrInfo = {};
    let imgBlob = null;
    let mbrId;

    onMount(async () => {
        // 쿼리스트링으로 넘어온 pspnId가 있으면 스토어에 보관
        const qPspnId = $page.url.searchParams.get("pspnId");
        if (qPspnId) {
            $drcpPspnId = qPspnId;
        }

        $footCheck = "menu2";
        jwt = localStorage.getItem("userJwt");
        const refresh = localStorage.getItem("refreshJwt");
        try {
            // 사용자 유효성 확인 (토큰 만료 시 예외 발생 가능)
            await getUserId(jwt).then(async (result) => {
                //id를 가져온 후의 로직을 작성.
                if (result != "" && result != undefined && result != "") {
                    mbrId = result;
                }
            });
            popUp = true;
            console.log("pharmacyData : ", shpDtl);
        } catch (err) {
            //에러가 토큰기간만료 코드라면 다시 재발급을 진행
            try {
                if (err.message == "21009") {
                    await updateRefresh(refresh);
                    location.reload();
                } else {
                    //아니라면 그냥 에러 출력.
                    console.error(err);
                }
            } catch (err) {
                //토큰 재발급 과정에서 에러 발생 시, 다시 로그인하도록 로그인 화면으로 보낸다.
                console.error(err);
                localStorage.setItem("refreshJwt", "");
                localStorage.setItem("userJwt", "");
                alert("토큰 재발급 오류 발생. 다시 로그인해주세요");
                $isLogin = false;
                goto("/mbr/uaLogin");
            }
        }
        console.log("pharmacyData : ", $pharmacyData);
        //agntId가 있을 때만 호출
        if (shpDtl.agntId) {
            await selectHiraInfo(shpDtl.agntId);
        } else {
            console.warn("agntId가 없습니다:", shpDtl);
        }
    });

    getTodayTime();
    dow = getDow();
    addMapScript(() => {
        makeDtlMap(shpDtl.shpLati, shpDtl.shpLongi, "drst");
    });

    function getTodayTime() {
        if ($pharmacyData.startTime != null && $pharmacyData.startTime != "") {
            todayTime = $pharmacyData.startTime.slice(0, 5) + " ~ " + $pharmacyData.endTime.slice(0, 5);
        } else {
            todayTime = "전화를 통해 영업 상태를 확인해주세요!";
        }
    }
    function xButton() {
        popUp = false;
    }
    function faxXButton() {
        faxPopUp = false;
    }

    // 전화번호 유틸
    function onlyDigits(v) {
        return (v || "").replace(/\D/g, "");
    }
    function formatPhoneDigits(d) {
        // 간단 하이픈 포맷 (국번 02 처리 포함)
        if (!d) return "";
        if (d.startsWith("02")) {
            if (d.length <= 2) return d;
            if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
            if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
            return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
        }
        if (d.length < 4) return d;
        if (d.length < 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
        if (d.length < 11) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
        return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
    }
    function isValidPhoneDigits(d) {
        // 국내 유효 길이 대략 9~11자리 허용 (02 지역번호 포함 케이스 고려)
        return d.length >= 9 && d.length <= 11;
    }
    function onPhoneInput(e) {
        const d = onlyDigits(e.target.value);
        faxNum = formatPhoneDigits(d);
        phoneError = "";
    }
    async function submitFaxPhone() {
        const digits = onlyDigits(faxNum);
        if (!isValidPhoneDigits(digits)) {
            phoneError = "전화번호를 정확히 입력해주세요.";
            return;
        }
        // 입력된 전화번호 확인
        console.log("입력 전화번호:", digits);
        faxPopUp = false;
        isLoading = true;
        // 전송에 필요한 회원/이미지 정보를 먼저 확보
        await getMbrTel(mbrId);
        await getPhoto();
        // 이미지가 준비된 뒤에 업로드 호출
        await sendFTP($drcpPspnId, onlyDigits(mbrInfo?.mbrTel || ""), digits);
    }

    async function sendFTP(pspnId, fromNumber, toNumber) {
        if (!imgBlob) {
            alert("이미지가 로드되지 않았습니다. 다시 시도하세요.");
            return;
        }
        try {
            // 파일 이름 생성: pspn_<id>_yyyyMMdd_HHmmss(확장자는 blob.type을 기반으로)
            const ext = imgBlob.type ? imgBlob.type.split("/").pop() : "jpg";
            const now = new Date();
            const pad = (n) => String(n).padStart(2, "0");
            const fileName = `pspn_${pspnId}_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.${ext}`;

            // Blob -> File (File 생성자가 일부 브라우저에서 제한적일 수 있지만 대부분 지원)
            let file;
            try {
                file = new File([imgBlob], fileName, { type: imgBlob.type || "image/jpeg" });
            } catch (e) {
                file = imgBlob;
                file.name = fileName;
            }

            const form = new FormData();
            form.append("file", file);
            form.append("fileName", fileName);
            form.append("pspnId", pspnId);
            form.append("toNumber", toNumber);
            form.append("fromNumber", fromNumber);

            const jwt = localStorage.getItem("userJwt");
            const endpoint = mobileUrlAddr + "/v1/webfax/sendFax";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: jwt ? { "bizportal-access-token": jwt } : {},
                body: form,
            });

            // 응답은 한 번만 읽어야 함(json/text 중 하나). 상태/헤더 먼저 로그
            console.log("sendFax status", { status: res.status, ok: res.ok, url: res.url });
            const ct = res.headers.get("content-type") || "";
            let data = null;
            if (ct.includes("application/json")) {
                data = await res.json().catch(() => null);
                console.log("sendFax json", data);
            } else {
                const text = await res.text().catch(() => null);
                console.log("sendFax text", text);
                // 필요하면 JSON 시도
                try {
                    data = text ? JSON.parse(text) : null;
                } catch {}
            }

            if (data && data.resultVO.faxResult.sendState == "3" && data.message == "OK.") {
                isLoading = false;
                faxState = true;
            }

            // if (data && data.errorType && (data.errorType === 'ALL_SUCCESS_OK' || data.errorType === 'ALL_SUCCESS')) {
            //   alert('전송 성공');
            // } else if (data && data.errorType && data.errorType !== 'ALL_SUCCESS_OK') {
            //   console.warn('sendFTP response', data);
            //   alert('전송 결과: ' + JSON.stringify(data));
            // } else {
            //   alert('전송 완료 (서버 응답 파싱 실패)');
            // }
        } catch (err) {
            console.error(err);
            alert("전송 중 오류가 발생했습니다. 콘솔을 확인하세요.");
        }
    }

    async function getPhoto() {
        const url = shopUrlAddr + "/v1/shop/storage/getPspnImage?pspnId=" + $drcpPspnId;
        const resData = await getFetch(url, localStorage.getItem("userJwt"));
        // getFetch가 Response를 반환한다고 가정
        const blob = await resData.blob();
        if (!blob || blob.size === 0) {
            console.warn("getPhoto: 빈 blob 응답");
            alert("이미지를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        imgBlob = blob; // store blob for upload
    }

    async function getMbrTel(mbrId) {
        const url = authUrlAddr + "/v1/member/selectMemberInfo?mbrId=" + mbrId;
        let resData = await getAPI(url);
        mbrInfo = resData;
        console.log("mbrInfo : ", mbrInfo);
        console.log("mbrInfoTel : ", onlyDigits(mbrInfo?.mbrTel || ""));
    }
    async function selectHiraInfo(agntId) {
        try {
            const url = shopUrlAddr + "/v1/hira/selectHiraInfo?agntId=" + agntId;
            let resData = await getAPI(url);
            return resData;
        } catch (error) {
            console.error("selectHiraInfo 오류:", error);
        }
    }
</script>

<Nav>{shpDtl.shpName}</Nav>

<div class="hos_info_top">
    <div class="box_hos">
        <div class="tit">
            <span>{shpDtl.shpName}</span>
        </div>
        <p class="dept">
            {shpDtl.shpAddr}
            {#if shpDtl.address2 != null}{shpDtl.address2}{/if}
        </p>
        <p class="time">
            <span>{dow}요일</span>
            {todayTime}
        </p>
    </div>
</div>
<section class="contents">
    {#if isLoading}
        <PageLoader />
    {:else}
        <h3>영업시간</h3>
        <div class="box_2">
            {#if (shpDtl?.shFrom && shpDtl?.shTo) || (shpDtl?.openStartTime && shpDtl?.openEndTime)}
                <dt>평일</dt>
                <dl>{shpDtl.shFrom} ~ {shpDtl.shTo}</dl>
            {:else}
                <div class="bg_gray">
                    <p class="txt_c">영업 시간 정보가 없습니다.</p>
                </div>
            {/if}
        </div>

        <h3>전화번호</h3>
        <div class="box_1">
            {shpDtl.shpTel}
            <div class="ar">
                <button type="button" class="mbtn_n_1" on:click={() => getCall(shpDtl.shpTel)}>전화하기</button>
            </div>
        </div>
        <!-- <h3>보유장비</h3>
    <div class="box_1">혈압기, 안마기</div> -->

        <h3>위치정보</h3>
        <div class="box_1">
            <p class="text1">
                {shpDtl.shpAddr}
                {#if shpDtl.address2 != null}{shpDtl.address2}{/if}
            </p>
            <!-- <p><span class="matro_1" /><span class="matro_7" /> 가산디지털단지</p> -->
            <!-- .matro_1 : 1호선, .matro_2 : 2호선, .matro_3 : 3호선, .matro_4 : 4호선, .matro_5 : 5호선, .matro_6 : 6호선, .matro_7 : 7호선, .matro_8 : 8호선, .matro_9 : 9호선, .matro_n1 인천1호선, .matro_n2 인천2호선, .matro_n3 수인분당호선, .matro_n4 신분당, .matro_n5 경의중앙, .matro_n6 공항철도, .matro_n7 경춘선, .matro_n8 의정부경전철선, .matro_n9 용인경전철, .matro_n10 : 경강선, .matro_n11 : 우이신설경전철, .matro_n12 : 서해선, .matro_n13 : 김포도시철도, .matro_n14 : 신림선 -->
            <div class="map_wrap">
                <div id="map" />
                <button
                    type="button"
                    class="mbtn_t_2b"
                    on:click={() => {
                        goMap(
                            "https://map.kakao.com/link/map/" +
                                shpDtl.shpName +
                                "," +
                                shpDtl.shpLati +
                                "," +
                                shpDtl.shpLongi
                        );
                    }}
                >
                    지도보기
                </button>
            </div>
        </div>
        <div style="padding:50px" />
        <div class="bottom_btn_fixed">
            <button
                type="button"
                class="newReg"
                id="new"
                on:click={() => {
                    faxPopUp = true;
                }}
                value="어느 방식을 선택하시겠습니까?"
            >
                처방전전송
            </button>
        </div>
    {/if}
</section>

<PopUp popUp={faxPopUp}>
    <slot>
        <div style="position:relative;">
            <button type="button" class="alert_close" on:click={faxXButton} style="position:absolute;right:0;top:0;">
                <i class="xi-close-min" />
            </button>
            <p style="margin-right:28px;">처방전 전송을 위해 약국 FAX 번호를 입력해주세요.</p>
            <div style="margin-top:12px;">
                <input
                    type="tel"
                    inputmode="tel"
                    placeholder="숫자만 입력하세요('-' 제외)"
                    bind:value={faxNum}
                    on:input={onPhoneInput}
                    style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:16px;"
                />
                {#if phoneError}
                    <small style="color:#e74c3c;display:block;margin-top:6px;">{phoneError}</small>
                {/if}
            </div>
        </div>
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
        <button type="button" class="mbtn_n_4" on:click={faxXButton}>취소</button>
        <button
            type="button"
            class="mbtn_n_1"
            on:click={submitFaxPhone}
            disabled={!isValidPhoneDigits((faxNum || "").replace(/\D/g, ""))}
            style="margin-left:8px;">확인</button
        >
    </p>
</PopUp>

<PopUp popUp={faxState}>
    <slot>
        <p>
            팩스 전송이 완료되었습니다.<button type="button" class="alert_close" on:click={xButton}
                ><i class="xi-close-min" /></button
            >
        </p>
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
        <button
            type="button"
            class="mbtn_n_4"
            name="chbtn"
            id="close"
            on:click={() => {
                xButton();
                goto(urlList.uaPspnLst);
            }}>확인</button
        >
    </p>
    <p />
</PopUp>
