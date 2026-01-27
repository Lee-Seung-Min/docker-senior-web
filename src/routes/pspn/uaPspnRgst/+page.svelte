<script>
    // @ts-nocheck

    import { onMount } from "svelte";
    import PopUp from "$lib/sub/nav/PopUp.svelte";
    import Nav from "$lib/sub/nav/Nav.svelte";
    import { goto } from "$app/navigation";
    import { urlList } from "$lib/urlList";
    import { getAPI } from "$lib/js/getAPI";
    import { makeStr } from "$lib/js/makeStr";
    import { postAPI } from "$lib/js/postAPI";
    import { page } from "$app/stores";
    import { footCheck } from "$lib/store/navStore.js";
    import {
        shopUrlAddr,
        authUrlAddr,
        adminUrlAddr,
        mobileUrlAddr,
    } from "$lib/js/urlAddr";
    import { drcpShpId } from "$lib/store/pspnStore.js";
    import SearchNav from "$lib/sub/nav/SearchNav.svelte";
    import {
        searchType,
        searchData,
        searchWhat,
        searchMount,
    } from "$lib/store/search";
    import { pharmacyData } from "$lib/store/pharmacyData";
    import PageLoader from "$lib/sub/PageLoader.svelte";
    import { getOsType } from "$lib/js/phoneAction";
    import { listUserLocation } from "$lib/store/userLocation";
    import cryptoJs from "crypto-js";
    import { decrypt, encrypt, getEncryptItems } from "$lib/js/aes256";
    import { chngDateTimeSecondsFormat } from "$lib/js/dateFunction";
    import { drcpPspnId } from "$lib/store/pspnStore.js";
    import { getUserId } from "$lib/js/getUserId";
    import { getFetch } from "$lib/js/getFetch";
    import { updateRefresh } from "$lib/js/updateRefresh";

    let drstList = [];
    let jwt = "";

    let favPopUp = false;
    let favShpId = null;
    let favNowYon = "N";
    let mbrId = 0;

    let favDrst = [];
    let popUp = false;
    let popUp2 = false;
    let lat = "";
    let lon = "";
    let shpPage = 1;
    let noMore = false;
    let isFirstSearch = true;
    let week = 0;
    let isLoading = true;

    // Intersection Observer 설정
    let sentinel;
    let observer;
    let encShpLati;
    let encShpLongi;
    let encDistance;
    let encryptItems = [];

    // ✅ 이미지 모달 상태 (open으로만 제어)
    let open = false;
    let imgSrc = ""; // blob URL
    let imgTitle = "";
    let imgLoading = false;

    // ✅ 배경 클릭 시 닫기 (리소스 정리까지)
    function onBackdropClick() {
        closeImagePopup();
    }

    // ✅ 모달 내부 클릭 전파 막기
    function stop(e) {
        e.stopPropagation();
    }

    onMount(async () => {
        $footCheck = "menu2";
        $searchType = "P";
        jwt = localStorage.getItem("userJwt") ?? "";
        if (jwt) {
            try {
                mbrId = await getUserId(jwt);
            } catch (e) {
                mbrId = 0;
            }
        }

        search();
    });
    
    function close() {
        popUp2 = false;
        goto(urlList.uaPspnLst);
    }

    function distance(e) {
        if (e >= 1000) {
            return (e / 1000).toString().slice(0, 4) + "km";
        } else {
            return e + "m";
        }
    }

    async function search() {
        noMore = true;
        isLoading = true;

        let url =
            authUrlAddr + "/v1/ppds/ext/distanceToPharm?ppdsId=" + $drcpPspnId;
        drstList = await getAPI(url);

        noMore = false;
        isLoading = false;
    }

    const searchDrst = (event) => search();

    function isTimeBetween(startTime, endTime) {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        const currentTime = `${h}:${m}:${s}`;

        if (startTime <= endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    async function sendFax(faxNumber, shpId) {
        let newFaxNum = faxNumber.replace(/-/g, "");
        let url =
            shopUrlAddr +
            "/webfax/sendFax?pspnId=" +
            $drcpPspnId +
            "&toNumber=" +
            newFaxNum +
            "&shpId=" +
            shpId;

        try {
            isLoading = true;
            const result = await postAPI(
                url,
                null,
                localStorage.getItem("userJwt"),
            );

            if (result.code == 0) {
                isLoading = false;
                popUp2 = true;
            }
        } catch (error) {}
    }

    function openFavPopup(drst) {
        favShpId = drst.shpId;
        favNowYon = drst.favorite ? "Y" : "N";
        favPopUp = true;
    }

    async function confirmFav() {
        const favType = "D";

        const jsonStr = makeStr({ shpId: favShpId, mbrId, favType });
        const url =
            mobileUrlAddr +
            (favNowYon === "Y" ? "/v1/favShop/delFav" : "/v1/favShop/addFav");

        const res = await postAPI(url, jsonStr, jwt);

        if (res?.resultVO === true) {
            favPopUp = false;
            drstList = drstList.map((d) =>
                d.shpId === favShpId
                    ? { ...d, shpFavYon: favNowYon === "Y" ? "N" : "Y" }
                    : d,
            );
        }

        window.location.reload();
    }

    function closeFavPopup() {
        favPopUp = false;
    }

    // ✅ 이미지 모달 열기 + 이미지 fetch
    async function openImagePopup(drst) {
        open = true;

        imgTitle = drst?.shpName ?? "이미지";
        imgLoading = true;

        if (imgSrc) URL.revokeObjectURL(imgSrc);
        imgSrc = "";

        try {
            const url = `${shopUrlAddr}/v1/Shop/ext/getShopImage?shpId=${drst.shpId}`;

            let token = localStorage.getItem("userJwt") ?? "";
            let res = await getFetch(url, token);

            if (res.status === 401) {
                await updateRefresh();
                token = localStorage.getItem("userJwt") ?? "";
                res = await getFetch(url, token);
            }

            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(`image fetch failed: ${res.status} ${msg}`);
            }

            const blob = await res.blob();
            imgSrc = URL.createObjectURL(blob);
        } catch (e) {
            console.log(e);
        } finally {
            imgLoading = false;
        }
    }

    // ✅ 닫기 (모달 + blob url 해제)
    function closeImagePopup() {
        open = false;
        if (imgSrc) URL.revokeObjectURL(imgSrc);
        imgSrc = "";
        imgLoading = false;
    }
</script>

<Nav>약국 지정</Nav>

<section class="contents">
    <div class="list_box" id="pre_list">
        {#if isLoading}
            <PageLoader />
        {:else}
            <!-- 약국 정보 S -->
            {#each drstList as drst}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="box_1">
                    <div class="top_actions">
                        <button
                            type="button"
                            aria-label="즐겨찾기"
                            on:click|stopPropagation={() => openFavPopup(drst)}
                        >
                            {#if drst.favorite}
                                <i
                                    class="xi-star"
                                    style="background-color: transparent; color: #ffd966; padding: 0; margin: 0; font-size: 24px;"
                                ></i>
                            {:else}
                                <i
                                    class="xi-star-o"
                                    style="background-color: transparent; color: #ffd966; padding: 0; margin: 0; font-size: 24px;"
                                ></i>
                            {/if}
                        </button>
                    </div>
                    <div class="pspnLst">
                        <p class="name">
                            <span
                                class="cursor-pointer"
                                style="margin: 0"
                                on:click|stopPropagation={() =>
                                    openImagePopup(drst)}
                            >
                                {drst.shpName}
                                <i class="xi-image-o" style="padding: 4px"></i>
                            </span>
                        </p>

                        <p class="dept" style="padding-top: 6px;">
                            {drst.sdtlAddr} | {drst.distance.toFixed(2)} km
                        </p>
                        <p class="time">
                            <span>영업시간</span>
                            {#if drst.isWorkDayOfWeek == "1"}
                                {drst.startTime.substr(0, 5)} ~ {drst.endTime.substr(
                                    0,
                                    5,
                                )}
                            {:else}
                                휴무중
                            {/if}
                        </p>
                    </div>
                    {#if drst.isWorkDayOfWeek == "1" && isTimeBetween(drst.startTime, drst.endTime)}
                        <button
                            type="button"
                            class="send-btn"
                            on:click|stopPropagation={() => {
                                if (drst.isWorkDayOfWeek == "1") {
                                    sendFax(drst.sdtlFax, drst.shpId);
                                } else {
                                    popUp = true;
                                }
                            }}>처방전 보내기</button
                        >
                    {/if}
                </div>
            {/each}
            <!-- 약국 정보 E -->
        {/if}
    </div>

    <!-- <div bind:this={sentinel} /> -->
</section>

{#if favPopUp}
    <PopUp popUp={favPopUp}>
        <slot>
            {favNowYon === "Y"
                ? "즐겨찾기를 해제하시겠습니까?"
                : "즐겨찾기에 추가하시겠습니까?"}
            <button type="button" class="alert_close" on:click={closeFavPopup}>
                <i class="xi-close-min" />
            </button>
        </slot>

        <p slot="btns" class="btn_wrap">
            <button type="button" class="mbtn_n_4" on:click={confirmFav}
                >예</button
            >
            <button type="button" class="mbtn_n_9" on:click={closeFavPopup}
                >아니오</button
            >
        </p>
    </PopUp>
{/if}

{#if open}
    <div class="modal-backdrop" on:click={onBackdropClick}>
        <div class="modal-panel" on:click={stop}>
            <div class="modal-header">
                <p class="modal-title">{imgTitle}</p>
                <button
                    type="button"
                    class="icon-btn"
                    on:click={closeImagePopup}
                >
                    <i class="xi-close-min" />
                </button>
            </div>

            <div class="img_wrap">
                {#if imgLoading}
                    <div class="img_loading">로딩중...</div>
                {:else if imgSrc}
                    <img class="popup_img" src={imgSrc} alt={imgTitle} />
                {:else}
                    <div class="img_empty">이미지가 없습니다.</div>
                {/if}
            </div>

            <div class="modal-footer"></div>
        </div>
    </div>
{/if}

<PopUp popUp={popUp2}>
    <slot>
        <p>처방전이 전송되었습니다.<br />처방 목록 페이지로 이동합니다.</p>
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
        <button
            type="button"
            class="mbtn_n_4"
            name="chbtn"
            id="close"
            on:click={close}>확인</button
        >
    </p>
    <p />
</PopUp>

<style>
    .box_1 {
        position: relative;
    }

    /* 우측 상단: 이미지 + 즐겨찾기 나란히 */
    .top_actions {
        position: absolute;
        top: 14px;
        right: 14px;
        display: flex;
        gap: 10px;
        z-index: 2;
    }

    .send-btn {
        background-color: #0fa5d4;
        width: 100%;
        padding: 10px 0;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        margin: 20px 0 8px 0;
    }

    .pspnLst {
        padding-right: 100px;
    }

    .img_wrap {
        margin: 0 auto;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto; /* 혹시라도 더 크면 내부 스크롤 */
    }

    .popup_img {
        max-width: 100%;
        width: auto;
        margin: 8px 0;
        height: auto;
        border-radius: 8px;
        object-fit: contain; /* 팝업 안에 “전부 보이게” */
        display: block;
    }

    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7); /* 검은색 투명 배경 */
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 16px;
    }

    .modal-panel {
        background: #fff; /* 하얀색 배경 */
        border-radius: 10px;
        max-width: 560px; /* 이미지보다 약간 크게 보이게 */
        width: 100%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        overflow: hidden;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid #eee;
    }

    .modal-title {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 800;
    }

    .icon-btn {
        font-size: 24px;
        background: transparent;
        border: none;
        padding: 6px;
        border-radius: 10px;
        cursor: pointer;
    }

    .icon-btn:hover {
        background: rgba(0, 0, 0, 0.06);
    }

    .modal-footer {
        padding: 12px 16px 16px;
        display: flex;
        justify-content: center;
    }
</style>
