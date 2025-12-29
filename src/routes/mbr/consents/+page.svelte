<script>
    import Nav from "$lib/sub/nav/Nav.svelte";
    import { goto } from "$app/navigation";
    import { urlList } from "$lib/urlList";
    import { apiServerAddr } from "$lib/js/urlAddr";
    import { getAPI } from "$lib/js/getAPI";
    import { isLogin } from "$lib/store/loginStore";
    import { updateRefresh } from "$lib/js/updateRefresh";
    import { onMount } from "svelte";

    let jwt = "";
    let refresh = "";
    let consents = [];

    // 이미지 보기 모달 상태
    let isViewerOpen = false;
    let selectedConsent = null;
    let imageUrl = "";
    let imageLoading = false;
    let imageError = "";

    // ✅ fetch 취소용
    let imageFetchController = null;

    function gotoPage(url) {
        goto(url);
    }

    function formatDate8(yyyymmdd) {
        if (!yyyymmdd || yyyymmdd.length < 8) return yyyymmdd || "";
        return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
    }

    function lockBodyScroll(lock) {
        document.body.style.overflow = lock ? "hidden" : "";
        document.body.style.touchAction = lock ? "none" : "";
    }

    async function loadConsents() {
        const url = apiServerAddr + "/v1/consents";
        const result = await getAPI(url, jwt);
        consents = result?.resultVO ?? [];
    }

    async function openConsentImage(consent) {
        // ✅ 이전 요청이 있으면 취소 (연타/다른 항목 클릭 시)
        if (imageFetchController) {
            imageFetchController.abort();
            imageFetchController = null;
        }

        // ✅ 이전 objectURL 정리
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
            imageUrl = "";
        }

        selectedConsent = consent;
        isViewerOpen = true;
        lockBodyScroll(true);

        imageLoading = true;
        imageError = "";

        imageFetchController = new AbortController();

        try {
            const url = `${apiServerAddr}/v1/consents/${consent.consentId}/image`;

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "bizportal-access-token": jwt,
                },
                // credentials: "include",
                signal: imageFetchController.signal,
            });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`image fetch failed: ${res.status} ${t}`);
            }

            const blob = await res.blob();
            imageUrl = URL.createObjectURL(blob);
        } catch (e) {
            // ✅ 사용자가 닫아서 abort 된 건 정상 처리
            if (e?.name === "AbortError") return;

            console.error(e);
            imageError = "이미지를 불러오지 못했습니다.";
        } finally {
            imageLoading = false;
            imageFetchController = null;
        }
    }

    function closeViewer() {
        // ✅ 진행 중 fetch 취소
        if (imageFetchController) {
            imageFetchController.abort();
            imageFetchController = null;
        }

        isViewerOpen = false;
        selectedConsent = null;
        imageError = "";
        imageLoading = false;

        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
            imageUrl = "";
        }

        lockBodyScroll(false);
    }

    onMount(async () => {
        try {
            jwt = localStorage.getItem("userJwt");
            refresh = localStorage.getItem("refreshJwt");
            await loadConsents();
        } catch (err) {
            try {
                if (err.message == "21009") {
                    await updateRefresh(refresh);
                    location.reload();
                } else {
                    console.error(err);
                }
            } catch (err) {
                console.error(err);
                localStorage.setItem("refreshJwt", "");
                localStorage.setItem("userJwt", "");
                alert("토큰 재발급 오류 발생. 다시 로그인해주세요");
                $isLogin = false;
                goto(urlList.uaLogin);
            }
        }
    });
</script>

<Nav>약 대리수령 위임장</Nav>

<section class="contents">
    {#if consents.length === 0}
        <div class="empty">저장된 위임장이 없습니다.</div>
    {:else}
        <ul class="list">
            {#each consents as c (c.consentId)}
                <li
                    class="item"
                    role="button"
                    tabindex="0"
                    on:click={() => openConsentImage(c)}
                    on:keydown={(e) => e.key === "Enter" && openConsentImage(c)}
                >
                    <div class="left">
                        <div class="title">
                            위임장
                            {#if c.agreed === true}
                                <span class="badge ok">동의</span>
                            {:else}
                                <span class="badge no">비동의</span>
                            {/if}
                        </div>

                        <div class="meta">
                            <span>대리인: {c.agentName || "-"}</span>
                            <span class="dot">•</span>
                            <span>관계: {c.agentRelation || "-"}</span>
                            <span class="dot">•</span>
                            <span>연락처: {c.agentPhone || "-"}</span>
                            <span class="dot">•</span>
                            <span>작성일: {formatDate8(c.signedDate)}</span>
                        </div>
                    </div>

                    <div class="right">
                        <span class="chev">›</span>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}

    {#if isViewerOpen}
        <div class="modal-backdrop" on:click|self={closeViewer}>
            <div class="modal" on:click|stopPropagation>
                <div class="modal-top">
                    <div class="modal-title">
                        <!-- 위임장 #{selectedConsent?.consentId} -->
                    </div>
                    <button
                        class="close"
                        on:click={closeViewer}
                        aria-label="닫기">✕</button
                    >
                </div>

                <div class="modal-body">
                    {#if imageLoading}
                        <div class="loading">이미지 불러오는 중...</div>
                    {:else if imageError}
                        <div class="error">{imageError}</div>
                    {:else}
                        <img
                            class="doc-img"
                            src={imageUrl}
                            alt="동의서 이미지"
                        />
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</section>

<button
    style="font-size: 1.2em"
    on:click={() => gotoPage(urlList.newConsent)}
    class="fixed bottom-6 right-6 mb-24 me-2 rounded-full px-5 py-3 bg-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
>
    + 새로 작성하기
</button>

<style>
    .contents {
        max-width: 1000px;
        margin: 0 auto;
        width: 100%;
        padding: 24px 24px 120px;
    }

    .empty {
        padding: 18px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 12px;
        background: #fff;
        font-weight: 700;
    }

    .list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 12px;
    }

    .item {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        padding: 14px 14px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 14px;
        background: #fff;
        cursor: pointer;
        user-select: none;
    }
    .item:active {
        transform: scale(0.995);
    }
    .item:focus {
        outline: 2px solid rgba(59, 130, 246, 0.5);
        outline-offset: 2px;
    }

    .title {
        font-weight: 900;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .badge {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 999px;
        font-weight: 900;
    }
    .badge.ok {
        background: rgba(16, 185, 129, 0.12);
        color: #065f46;
    }
    .badge.no {
        background: rgba(239, 68, 68, 0.12);
        color: #7f1d1d;
    }

    .meta,
    .meta2 {
        margin-top: 0.8em;
        margin-bottom: 0.3em;
        font-size: 1em;
        color: #374151;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }
    .dot {
        opacity: 0.6;
    }

    .right {
        display: flex;
        align-items: center;
        padding-left: 8px;
        color: #6b7280;
        font-size: 24px;
        font-weight: 900;
    }

    /* modal */
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 9999;
    }
    .modal {
        width: min(980px, 100%);
        max-height: 90vh; /* 🔑 화면 기준 최대 높이 */
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .modal-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    .modal-title {
        font-weight: 900;
    }
    .close {
        border: 0;
        background: transparent;
        font-size: 18px;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 10px;
    }
    .close:hover {
        background: rgba(0, 0, 0, 0.06);
    }
    .modal-body {
        flex: 1;
        padding: 14px;
        background: #f9fafb;
        overflow: auto;
    }
    .loading,
    .error {
        padding: 16px;
        background: #fff;
        border-radius: 12px;
        font-weight: 800;
    }
    .doc-img {
        max-width: 100%;
        max-height: 100%;
        /* width: 100%; */
        height: auto;
        display: block;
        margin: 0 auto;
        border-radius: 12px;
        background: #fff;
    }
</style>
