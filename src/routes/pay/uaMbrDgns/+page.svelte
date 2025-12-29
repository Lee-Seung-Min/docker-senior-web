<!--  회원 진료 결제  -->
<script>
    // @ts-nocheck
    import { onMount } from "svelte";
    import Nav from "$lib/sub/nav/Nav.svelte";
    import PageLoader from "$lib/sub/PageLoader.svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { getAPI } from "$lib/js/getAPI";
    import { postAPI } from "$lib/js/postAPI";
    import { adminUrlAddr } from "$lib/js/urlAddr";
    import { useDgnsInfo } from "$lib/store/pay/useDgnsInfo";
    import { decrypt } from "$lib/js/aes256";

    const CARD_STORAGE_KEY = "card_list";
    const userType = "member";

    let dgnsId;
    let isLoading = true;

    // 진료/병원 정보
    let dgnsInfo = {};
    let hospitalName = "";
    let deptName = "";
    let amount = 0;

    //mpay_id
    let mpayId = "";

    // 저장된 카드 목록
    let cardList = [];
    let selectedCardId = null;

    // 결제수단 라디오
    let paymentMethod = "registered"; // registered | account | normal

    // 병원 계좌 정보 (useDgnsInfo에서 가져옴)
    let hsptBankInfo = null;

    onMount(async () => {
        dgnsId = $page.url.searchParams.get("dgnsId");
        if (!dgnsId) {
            alert("진료 정보를 찾을 수 없습니다.");
            goto("/");
            return;
        }

        await loadDgnsInfo();
        loadCards();
        await loadHsptBankInfo();
        isLoading = false;
    });

    async function loadDgnsInfo() {
        try {
            const url = `${adminUrlAddr}/v1/mpay/selectMobileDgnsPayinfo`;
            const jsonStr = JSON.stringify({ dgnsId });
            const res = await postAPI(url, jsonStr);
            console.log("dgnsInfo : ", res);

            if (res && res.resultVO) {
                dgnsInfo = res.resultVO;
                hospitalName = dgnsInfo.shpNam || "병원명";
                deptName = dgnsInfo.deptNam || "진료과";
                amount = dgnsInfo.dgnsPay || 0;
                mpayId = dgnsInfo.mpayId;
            }
        } catch (error) {
            console.error("진료 정보 로드 실패:", error);
            alert("진료 정보를 불러오는데 실패했습니다.");
        }
    }

    function loadCards() {
        try {
            const raw = sessionStorage.getItem(CARD_STORAGE_KEY) || localStorage.getItem(CARD_STORAGE_KEY);

            if (!raw) {
                cardList = [];
                return;
            }

            const parsed = JSON.parse(raw);
            cardList = Array.isArray(parsed) ? parsed : [];

            if (cardList.length > 0) {
                selectedCardId = cardList[0].plstId;
            }
        } catch (e) {
            console.error("카드 목록 불러오기 실패", e);
            cardList = [];
        }
    }

    function selectCard(id) {
        selectedCardId = id;
    }

    function goCardManage() {
        goto("/mbr/uaMbrCrdLst");
    }

    async function loadHsptBankInfo() {
        if (!mpayId) return;

        try {
            const url = `${adminUrlAddr}/v1/mpay/selectHsptBank`;
            const jsonStr = JSON.stringify({ mpayId });
            const res = await postAPI(url, jsonStr);

            if (res && res.resultVO) {
                hsptBankInfo = res.resultVO;

                // 계좌번호 복호화
                if (hsptBankInfo.sdtlBankNum) {
                    hsptBankInfo.sdtlBankNum = decrypt(hsptBankInfo.sdtlBankNum);
                }

                console.log("병원 계좌 정보:", hsptBankInfo);
            }
        } catch (error) {
            console.error("병원 계좌 정보 로드 실패:", error);
        }
    }

    async function handlePay() {
        // 결제 완료 처리 실행
        const completeResult = await goDgnsPayComplete();

        if (completeResult) {
            alert(`${amount.toLocaleString()}원 결제가 완료되었습니다.`);
            goto("/dgns/uaDgnsLst");
        }
    }

    function formatCardNumber(card) {
        const n1 = card.cardNo1 || "";
        const n4 = card.cardNo4 || "";
        if (!n1 && !n4) return card.plstCardNo || "";
        return `${n1} - **** - **** - ${n4}`;
    }

    function cardTypeLabel(card) {
        if (card.cardType === "CORPORATE") return "법인카드";
        return "개인카드";
    }

    async function goDgnsPayComplete() {
        isLoading = true;

        try {
            const url = `${adminUrlAddr}/v1/mpay/setPayComplete`;
            const jsonStr = JSON.stringify({ mpayId: dgnsInfo.mpayId });
            const res = await postAPI(url, jsonStr);

            if (res.code !== 0) {
                console.error("결제 완료 처리 실패:", res.resultVO?.ErrorMsg);
                alert(res.resultVO?.ErrorMsg || "결제 완료 처리에 실패했습니다.");
                return false;
            }

            // 진료 정보 갱신
            await loadDgnsInfo();
            return true;
        } catch (error) {
            console.error("결제 완료 처리 중 오류:", error);
            alert("결제 완료 처리 중 오류가 발생했습니다.");
            return false;
        } finally {
            isLoading = false;
        }
    }

    // async function get
</script>

<section>
    <Nav>병원 결제</Nav>

    {#if !isLoading}
        <section class="contents">
            <!-- 병원/결제 정보 박스 -->
            <div class="info-box">
                <div class="info-row">
                    <span class="label">병원명</span>
                    <span class="value">{hospitalName}</span>
                </div>
                <div class="info-row">
                    <span class="label">진료과</span>
                    <span class="value">{deptName}</span>
                </div>
                <div class="info-row">
                    <span class="label">진료비</span>
                    <span class="value">{amount.toLocaleString()}원</span>
                </div>
                <div class="info-row">
                    <span class="label">결제 금액</span>
                    <span class="value strong">{amount.toLocaleString()}원</span>
                </div>
            </div>

            <!-- 결제수단 -->
            <div class="pay-box">
                <div class="section-title">결제수단</div>

                <!-- 라디오: 등록된 카드 / 계좌번호 / 일반 결제 -->
                <div class="radio-row">
                    <label>
                        <input type="radio" value="registered" bind:group={paymentMethod} />
                        등록된 카드로 결제
                    </label>
                </div>
                <div class="radio-row">
                    <label>
                        <input type="radio" value="account" bind:group={paymentMethod} />
                        계좌이체로 결제
                    </label>
                </div>
                <!-- 등록된 카드로 결제 선택 시 -->
                {#if paymentMethod === "registered"}
                    <div class="card-select-area">
                        {#if cardList.length === 0}
                            <!-- 등록된 카드 없음 -->
                            <div
                                class="empty-card"
                                on:click={goCardManage}
                                on:keydown={(e) => e.key === "Enter" && goCardManage()}
                                tabindex="0"
                                role="button"
                            >
                                <div class="plus-icon">+</div>
                                <p>등록된 카드가 없습니다.</p>
                                <p>카드를 등록하려면 클릭하세요.</p>
                            </div>
                        {:else}
                            <!-- 카드 선택 리스트 -->
                            <div class="saved-card-list">
                                {#each cardList as card}
                                    <div
                                        class="saved-card {card.plstId === selectedCardId ? 'selected' : ''}"
                                        on:click={() => selectCard(card.plstId)}
                                        on:keydown={(e) => e.key === "Enter" && selectCard(card.plstId)}
                                        tabindex="0"
                                        role="button"
                                    >
                                        <div class="saved-card-header">
                                            <span class="card-type-label">{cardTypeLabel(card)}</span>
                                            {#if card.cardAlias}
                                                <span class="divider">|</span>
                                                <span class="card-alias">{card.cardAlias}</span>
                                            {/if}
                                        </div>

                                        <div class="saved-card-number">
                                            {formatCardNumber(card)}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- 계좌번호로 결제 선택 시 -->
                {#if paymentMethod === "account"}
                    <div class="account-input-area">
                        {#if hsptBankInfo}
                            <div class="bank-info-display">
                                <div class="info-item">
                                    <span class="info-label">은행명</span>
                                    <span class="info-value">{hsptBankInfo.sdtlBank || "-"}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">계좌번호</span>
                                    <span class="info-value">{hsptBankInfo.sdtlBankNum || "-"}</span>
                                </div>
                            </div>
                            <p class="account-notice">위 계좌로 입금 후 병원에 확인해주세요.</p>
                        {:else}
                            <p class="no-account-info">병원 계좌 정보가 없습니다.</p>
                        {/if}
                    </div>
                {/if}
            </div>
        </section>

        <!-- 하단 결제 버튼 -->
        {#if paymentMethod !== "account"}
            <div class="pay-bottom">
                <button type="button" class="btn-pay" on:click={handlePay}>
                    {amount.toLocaleString()}원 결제하기
                </button>
            </div>
        {/if}
    {/if}

    {#if isLoading}
        <PageLoader />
    {/if}
</section>

<style>
    .contents {
        padding: 16px;
        padding-bottom: 140px; /* 80px에서 140px로 증가 */
    }

    /* 병원 정보 박스 */
    .info-box {
        background: #fff;
        border-radius: 10px;
        padding: 12px 16px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        margin-bottom: 16px;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 14px;
    }

    .info-row + .info-row {
        border-top: 1px solid #f2f2f2;
    }

    .info-row .label {
        color: #777;
    }

    .info-row .value {
        color: #333;
    }

    .info-row .value.strong {
        font-weight: 700;
        color: #ff5b5b;
    }

    /* 결제수단 박스 */
    .pay-box {
        background: #fff;
        border-radius: 10px;
        padding: 12px 16px 16px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .section-title {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 8px;
    }

    .radio-row {
        font-size: 14px;
        padding: 8px;
    }

    input[type="radio"] {
        width: 24px;
        height: 24px;
        margin: 8px;
    }

    /* 계좌번호 입력 영역 */
    .account-input-area {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .bank-info-display {
        background: #f8f8f8;
        border-radius: 8px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
    }

    .info-item + .info-item {
        border-top: 1px solid #e8e8e8;
    }

    .info-label {
        font-size: 13px;
        color: #777;
        font-weight: 500;
    }

    .info-value {
        font-size: 14px;
        color: #333;
        font-weight: 600;
    }

    .account-notice {
        font-size: 12px;
        color: #ff5b5b;
        text-align: center;
        margin: 4px 0 0 0;
        line-height: 1.4;
    }

    .no-account-info {
        font-size: 13px;
        color: #999;
        text-align: center;
        padding: 20px 0;
        margin: 0;
    }

    /* 카드 선택 영역 */
    .card-select-area {
        margin-top: 10px;
    }

    .empty-card {
        width: 100%;
        height: 190px;
        border-radius: 12px;
        background: #222;
        background-image: linear-gradient(135deg, #333 0%, #111 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #eee;
        cursor: pointer;
    }

    .empty-card .plus-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 26px;
        margin-bottom: 10px;
    }

    .empty-card p {
        margin: 0;
        font-size: 13px;
    }

    /* 저장된 카드 리스트 */
    .saved-card-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .saved-card {
        position: relative;
        border-radius: 12px;
        padding: 14px 16px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .saved-card.selected {
        outline: 3px solid #000000;
        box-shadow: 0 4px 12px rgba(255, 91, 91, 0.3);
    }

    .saved-card-header {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 10px;
        font-size: 13px;
    }

    .card-type-label {
        font-weight: 600;
    }

    .card-alias {
        font-size: 13px;
    }

    .saved-card-header .divider {
        color: #888;
    }

    .saved-card-number {
        font-size: 18px;
        letter-spacing: 2px;
        white-space: nowrap;
    }

    /* 하단 결제 버튼 */
    .pay-bottom {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 85px; /* 0에서 60px로 변경 - Nav 높이만큼 올림 */
        padding: 8px 12px;
        background: #fff;
        box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.06);
        z-index: 100;
    }

    .btn-pay {
        width: 100%;
        padding: 14px 0;
        border-radius: 8px;
        border: none;
        background: #ff5b5b;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-pay:active {
        background: #e04545;
    }
</style>
