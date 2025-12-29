<!-- <script>
    // @ts-nocheck

    import { onMount } from "svelte";

    import PopUp from "$lib/sub/nav/PopUp.svelte";
    import Nav from "$lib/sub/nav/Nav.svelte";
    import { goto } from "$app/navigation";
    import { urlList } from "$lib/urlList";
    import { getAPI } from "$lib/js/getAPI";
    import { postAPI } from "$lib/js/postAPI";
    import { deleteAPI } from "$lib/js/deleteAPI";
    import { adminUrlAddr, authUrlAddr, smartroSet } from "$lib//js/urlAddr";
    import { isLogin } from "$lib/store/loginStore";
    import { updateRefresh } from "$lib/js/updateRefresh";
    import { Stretch } from "svelte-loading-spinners";
    import PageLoader from "$lib/sub/PageLoader.svelte";
    import { makeStr } from "$lib/js/makeStr.js";

    let active;
    let isLoading = false;
    let observer;
    let noMore = false;
    let sentinel;
    let page = 0;
    let plstList = [];
    let removeId;

    let billkeyFormData = {};

    onMount(async () => {
        // 동적으로 메타 태그 추가
        const scriptTag = document.createElement("script");
        console.log(import.meta.env.VITE_SMARTRO_URL_SET);
        scriptTag.src = import.meta.env.VITE_SMARTRO_URL_SET;
        document.head.appendChild(scriptTag);

        // loadPlstList().then(() => {
        //     initIntersectionObserver();
        //     isLoading = false;
        // });
        // initBlnTkn();
    });

    function initIntersectionObserver() {
        const io = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // 스크롤이 일정 위치에 도달하면 추가 데이터 불러오기
                    if (!noMore) {
                        loadPlstList();
                    }
                }
            });
        }, {});

        io.observe(sentinel);
    }

    async function loadPlstList() {
        let url = adminUrlAddr + "/v1/smartroPay/uaMbrCrdLoad?page=" + page;
        await getAPI(url).then((res) => {
            page++;
            plstList = [...plstList, ...res.resultVO];
        });
    }

    async function initBlnTkn() {
        let url = adminUrlAddr + "/v1/smartroPay/initBlnTkn";
        await getAPI(url).then((billKeyRes) => {
            billkeyFormData = billKeyRes.resultVO;
            billkeyFormData.returnUrl = adminUrlAddr + "/v1/smartroPay/ext/blnTknRgst";
        });
    }

    function goPay() {
        // 스마트로페이 초기화
        smartropay.init({
            mode: import.meta.env.VITE_SMARTRO_SET, // STG: 테스트, REAL: 운영(운영서버 전환 시 변경 필수!)
            actionUri: "/ssb/interface.do",
        });
        // 스마트로페이 빌링키 발급요청
        smartropay.payment({
            FormId: "tranMgr", // 폼ID
        });
    }

    // Action Sheet 보이기
    function showActionSheet(plstId) {
        removeId = plstId;
        document.getElementById("actionSheet").classList.add("active");
    }

    // Action Sheet 감추기
    function hideActionSheet() {
        document.getElementById("actionSheet").classList.remove("active");
        removeId = undefined;
    }

    // 각 옵션 클릭 시 처리
    function handleOption(option) {
        // 여기에 옵션 클릭 시 로직 작성
        alert("Selected Option: " + option);
        // Action Sheet 감추기
        hideActionSheet();
    }

    async function removeCard() {
        let jsonStr = makeStr({ removeId });
        const url = adminUrlAddr + "/v1/smartroPay/rmvPlstCard";
        await postAPI(url, jsonStr).then((res) => {
            plstList = [];
            page = 0;
            loadPlstList();
        });
    }
</script> -->

<script>
    // @ts-nocheck
    import { onMount } from "svelte";
    import Nav from "$lib/sub/nav/Nav.svelte";
    import PageLoader from "$lib/sub/PageLoader.svelte";

    const STORAGE_KEY = "card_list";

    let isLoading = false;
    let plstList = []; // [{ plstId, plstCardNm, plstCardNo, ... }]
    let selectedId = null; // action-sheet 에서 선택된 카드 id

    // 팝업 상태
    let popUp = false;
    let popupMode = null; // "add" | "edit" | "delete"

    // 입력 폼 상태
    let cardType = "PERSONAL"; // PERSONAL(개인) / CORPORATE(법인)
    let cardNo1 = "";
    let cardNo2 = "";
    let cardNo3 = "";
    let cardNo4 = "";
    let expMM = "";
    let expYY = "";
    let birthYY = "";
    let birthMM = "";
    let birthDD = "";
    let cardPw2 = "";
    let cardAlias = "";

    onMount(() => {
        loadCards();
    });

    // ===== Storage =====
    function loadCards() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                plstList = [];
                return;
            }
            const parsed = JSON.parse(raw);
            plstList = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("카드 목록 불러오기 실패", e);
            plstList = [];
        }
    }

    function saveCards() {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(plstList));
            // localStorage만 쓰고 싶으면 위 줄 대신 아래 줄 사용
            // localStorage.setItem(STORAGE_KEY, JSON.stringify(plstList));
        } catch (e) {
            console.error("카드 목록 저장 실패", e);
        }
    }

    function createCardId() {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return String(Date.now()) + String(Math.random());
    }

    function resetForm() {
        cardType = "PERSONAL";
        cardNo1 = "";
        cardNo2 = "";
        cardNo3 = "";
        cardNo4 = "";
        expMM = "";
        expYY = "";
        birthYY = "";
        birthMM = "";
        birthDD = "";
        cardPw2 = "";
        cardAlias = "";
    }

    function maskedCardNo(card) {
        const n1 = card.cardNo1 || "";
        const n4 = card.cardNo4 || "";
        if (!n1 && !n4) return "";
        return `${n1} - **** - **** - ${n4}`;
    }

    // ===== 카드 등록/수정/삭제 =====

    // 카드 등록 버튼 클릭 → 팝업 오픈
    function goPay() {
        resetForm();
        popupMode = "add";
        popUp = true;
    }

    // Action Sheet
    function showActionSheet(plstId) {
        selectedId = plstId;
        const el = document.getElementById("actionSheet");
        el && el.classList.add("active");
    }

    function hideActionSheet() {
        const el = document.getElementById("actionSheet");
        el && el.classList.remove("active");
    }

    function startEditCard() {
        if (!selectedId) return;
        const card = plstList.find((c) => c.plstId === selectedId);
        if (!card) return;

        cardType = card.cardType || "PERSONAL";
        cardNo1 = card.cardNo1 || "";
        cardNo2 = card.cardNo2 || "";
        cardNo3 = card.cardNo3 || "";
        cardNo4 = card.cardNo4 || "";
        expMM = card.expMM || "";
        expYY = card.expYY || "";
        birthYY = card.birthYY || "";
        birthMM = card.birthMM || "";
        birthDD = card.birthDD || "";
        cardPw2 = card.cardPw2 || "";
        cardAlias = card.cardAlias || card.plstCardNm || "";

        popupMode = "edit";
        popUp = true;
        hideActionSheet();
    }

    function startDeleteCard() {
        if (!selectedId) return;
        popupMode = "delete";
        popUp = true;
        hideActionSheet();
    }

    function closePopup() {
        popUp = false;
        popupMode = null;
        resetForm();
    }

    function confirmPopup() {
        if (popupMode === "add") {
            // (간단) 유효성 체크
            if (!cardNo1 || !cardNo2 || !cardNo3 || !cardNo4) {
                alert("카드번호를 모두 입력해주세요.");
                return;
            }

            const newCard = {
                plstId: createCardId(),
                cardType,
                cardAlias,
                cardNo1,
                cardNo2,
                cardNo3,
                cardNo4,
                expMM,
                expYY,
                birthYY,
                birthMM,
                birthDD,
                cardPw2,
            };
            // 화면에 보여줄 이름
            newCard.plstCardNm = cardAlias || (cardType === "PERSONAL" ? "개인카드" : "법인카드");
            newCard.plstCardNo = maskedCardNo(newCard);
            newCard.plstCardNo = maskedCardNo(newCard);

            plstList = [...plstList, newCard];
            saveCards();
        } else if (popupMode === "edit") {
            if (!selectedId) return;

            plstList = plstList.map((c) => {
                if (c.plstId !== selectedId) return c;
                const updated = {
                    ...c,
                    cardType,
                    cardAlias,
                    cardNo1,
                    cardNo2,
                    cardNo3,
                    cardNo4,
                    expMM,
                    expYY,
                    birthYY,
                    birthMM,
                    birthDD,
                    cardPw2,
                };
                updated.plstCardNm = cardType === "PERSONAL" ? "개인카드" : "법인카드";
                updated.plstCardNo = maskedCardNo(updated);
                return updated;
            });

            saveCards();
        } else if (popupMode === "delete") {
            if (!selectedId) return;
            plstList = plstList.filter((c) => c.plstId !== selectedId);
            saveCards();
        }

        closePopup();
        selectedId = null;
    }
</script>

<Nav>결제수단 관리</Nav>

<section class="contents">
    <div class="box_1">
        {#if plstList.length === 0}
            <p class="empty-text">등록된 카드가 없습니다.</p>
        {/if}

        {#each plstList as plstInfo}
            <div class="pay-manager">
                <div class="icon-box">
                    <img src="/lib/img/pay/card_icon.png" alt="card" />
                </div>

                <div class="content">
                    <!-- ✅ 첫 줄: 개인카드 | 카드 별칭 -->
                    <div class="title-line">
                        <span class="card-type-label">
                            {#if plstInfo.cardType === "PERSONAL"}
                                개인카드
                            {:else if plstInfo.cardType === "CORPORATE"}
                                법인카드
                            {:else}
                                {plstInfo.plstCardNm}
                            {/if}
                        </span>

                        {#if plstInfo.cardAlias}
                            <span class="divider">|</span>
                            <span class="card-alias">{plstInfo.cardAlias}</span>
                        {/if}
                    </div>

                    <div class="card-number-line">
                        <span>{plstInfo.cardNo1}</span>
                        <span>-</span>
                        <span>****</span>
                        <span>-</span>
                        <span>****</span>
                        <span>-</span>
                        <span>{plstInfo.cardNo4}</span>
                    </div>
                </div>

                <div class="setting">
                    <img
                        src="/lib/img/pay/set_icon.png"
                        alt="setting"
                        on:click={() => showActionSheet(plstInfo.plstId)}
                    />
                </div>
            </div>
        {/each}

        <button type="button" class="btn_01" on:click={goPay}> 카드 등록 </button>
    </div>
</section>

<!-- 카드 설정 Action Sheet -->
<div class="action-sheet" id="actionSheet" on:click={hideActionSheet}>
    <div class="action-options" on:click|stopPropagation>
        <div class="option close" on:click={hideActionSheet}>Close</div>
        <div class="option" on:click={startEditCard}>카드 수정</div>
        <div class="option" on:click={startDeleteCard}>카드 삭제</div>
    </div>
</div>

<!-- 카드 등록/수정/삭제 팝업 -->
{#if popUp}
    <section class="z_alert">
        <div class="box_1 card-popup">
            {#if popupMode === "delete"}
                <h3 class="popup-title">카드 삭제</h3>
                <p class="popup-desc">선택한 카드를 삭제하시겠습니까?</p>
            {:else}
                <h3 class="popup-title">
                    {#if popupMode === "add"}카드 등록{:else}카드 수정{/if}
                </h3>

                <div class="card-form">
                    <!-- 유형 선택 -->
                    <div class="card-form-row">
                        <span class="label">유형선택</span>
                        <div class="inputs">
                            <div class="card-type-tabs">
                                <button
                                    type="button"
                                    class:active={cardType === "PERSONAL"}
                                    on:click={() => (cardType = "PERSONAL")}
                                >
                                    개인
                                </button>
                                <button
                                    type="button"
                                    class:active={cardType === "CORPORATE"}
                                    on:click={() => (cardType = "CORPORATE")}
                                >
                                    법인
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- ✅ 카드 별칭 -->
                    <div class="card-form-row">
                        <span class="label">카드 별칭</span>
                        <div class="inputs alias-input">
                            <input type="text" placeholder="예: 우리은행 체크, 법인카드" bind:value={cardAlias} />
                        </div>
                    </div>

                    <!-- 카드번호 -->
                    <div class="card-form-row">
                        <span class="label">카드번호</span>
                        <div class="inputs card-number-inputs">
                            <input type="text" maxLength="4" bind:value={cardNo1} />
                            <span>-</span>
                            <input type="password" maxLength="4" bind:value={cardNo2} />
                            <span>-</span>
                            <input type="password" maxLength="4" bind:value={cardNo3} />
                            <span>-</span>
                            <input type="text" maxLength="4" bind:value={cardNo4} />
                        </div>
                    </div>

                    <!-- 유효기간 -->
                    <div class="card-form-row">
                        <span class="label">유효기간</span>
                        <div class="inputs expiry-inputs">
                            <input type="text" maxLength="2" placeholder="MM" bind:value={expMM} />
                            <span>/</span>
                            <input type="text" maxLength="2" placeholder="YY" bind:value={expYY} />
                        </div>
                    </div>

                    <!-- 생년월일 -->
                    <div class="card-form-row">
                        <span class="label">생년월일</span>
                        <div class="inputs birth-inputs">
                            <input type="text" maxLength="2" placeholder="YY" bind:value={birthYY} />
                            <span>/</span>
                            <input type="text" maxLength="2" placeholder="MM" bind:value={birthMM} />
                            <span>/</span>
                            <input type="text" maxLength="2" placeholder="DD" bind:value={birthDD} />
                        </div>
                    </div>

                    <!-- 카드 비밀번호 -->
                    <div class="card-form-row">
                        <span class="label">카드 비밀번호</span>
                        <div class="inputs pw-input">
                            <input type="password" maxLength="2" placeholder="앞 2자리 숫자" bind:value={cardPw2} />
                        </div>
                    </div>
                </div>
            {/if}

            <div class="popup-btns">
                <button type="button" class="btn-cancel" on:click={closePopup}> 취소 </button>
                <button type="button" class="btn-ok" on:click={confirmPopup}>
                    {#if popupMode === "delete"}삭제{:else}확인{/if}
                </button>
            </div>
        </div>
    </section>
{/if}

{#if isLoading}
    <PageLoader />
{/if}

<style>
    .contents {
        padding: 16px;
    }

    .box_1 {
        background: #fff;
    }

    .empty-text {
        padding: 20px 4px;
        font-size: 14px;
        color: #999;
    }

    .pay-manager {
        display: flex;
        align-items: center;
        padding: 12px 10px;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        margin-bottom: 10px;
        background: #fff;
    }

    .pay-manager .icon-box {
        margin-right: 10px;
    }

    .pay-manager .icon-box img {
        width: 32px;
        height: 32px;
    }

    .pay-manager .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 14px;
    }

    .pay-manager .setting img {
        width: 20px;
        height: 20px;
    }

    .btn_01 {
        width: 100%;
        padding: 12px 0;
        margin-top: 12px;
        border: none;
        border-radius: 8px;
        background: #ff5b5b;
        color: #fff;
        font-size: 16px;
    }

    .card-popup {
        position: relative;
        width: 90%;
        max-width: 420px;
        background: #fff;
        border-radius: 12px;
        padding: 18px 18px 14px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 1;
    }

    .popup-title {
        margin: 0 0 10px;
        font-size: 17px;
        font-weight: 600;
    }

    .popup-desc {
        margin: 12px 0;
        font-size: 14px;
    }

    .card-form {
        margin-top: 4px;
    }

    .card-form-row {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }

    .card-form-row .label {
        width: 80px;
        font-size: 13px;
        color: #777;
    }

    .card-form-row .inputs {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* 유형 선택 탭 */
    .card-type-tabs {
        display: flex;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid #ff5b5b;
    }

    .card-type-tabs button {
        flex: 1;
        padding: 6px 0;
        border: none;
        font-size: 13px;
        background: #fff;
        color: #999;
    }

    .card-type-tabs button.active {
        background: #fff0f0;
        color: #ff5b5b;
        font-weight: 600;
    }

    /* 카드번호 입력 */
    .card-number-inputs {
        /* 카드번호 4자리씩 고정 폭으로 배치 */
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .card-number-inputs input {
        width: 60px; /* 고정 폭 사용 */
        min-width: 60px; /* 최소 폭 보장 */
        max-width: 60px; /* 최대 폭 제한 */
        height: 40px;
        min-height: 40px; /* 최소 폭 보장 */
        max-height: 40px; /* 최대 폭 제한 */
        text-align: center;
        padding: 8px 4px;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
        font-size: 14px;
        box-sizing: border-box; /* 패딩과 보더 포함한 전체 크기 계산 */
    }

    .card-number-inputs span {
        padding: 0 2px;
        color: #999;
    }

    /* 유효기간, 생년월일 */
    .expiry-inputs input,
    .birth-inputs input {
        width: 50px;
        text-align: center;
        padding: 6px 0;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
        font-size: 13px;
    }

    .expiry-inputs span,
    .birth-inputs span {
        padding: 0 1px;
        color: #999;
    }

    /* 비밀번호 앞 2자리 */
    .pw-input input {
        width: 90px;
        text-align: center;
        padding: 6px 0;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
        font-size: 13px;
    }

    .popup-btns {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }

    .popup-btns button {
        min-width: 70px;
        padding: 6px 10px;
        border-radius: 6px;
        border: none;
        font-size: 14px;
    }

    .popup-btns .btn-cancel {
        background: #f2f2f2;
        color: #333;
    }

    .popup-btns .btn-ok {
        background: #ff5b5b;
        color: #fff;
    }
    .alias-input input {
        width: 100%;
        padding: 6px 8px;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
        font-size: 13px;
    }
    .title-line {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .card-type-label {
        font-weight: 600;
        font-size: 13px;
        color: #333;
    }

    .card-alias {
        font-size: 13px;
        color: #555;
    }

    .title-line .divider {
        color: #ccc;
    }
    .card-number-line {
        display: flex;
        flex-wrap: nowrap;
        gap: 2px;
        font-size: 14px;
    }

    .card-number-line span {
        white-space: nowrap;
    }
</style>
