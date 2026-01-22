<script>
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { apiServerAddr } from "$lib/js/urlAddr";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { onMount } from "svelte";

  let jwt = "";
  let refresh = "";

  // ✅ 동의서 존재 여부 (목록/버튼 표시용)
  let hasConsent = false;
  let loading = true;
  let errorMsg = "";

  // ✅ 모달 상태
  let isViewerOpen = false;
  let imageUrl = "";
  let imageLoading = false;
  let imageError = "";

  // ✅ fetch 취소용
  let controller = null;

  function gotoWrite() {
    goto(urlList.newPrivacyConsent);
  }

  function lockBodyScroll(lock) {
    document.body.style.overflow = lock ? "hidden" : "";
    document.body.style.touchAction = lock ? "none" : "";
  }

  function cleanupImageUrl() {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      imageUrl = "";
    }
  }

  async function checkHasConsent() {
    // 여기서는 "있나 없나"만 체크.
    // 서버에서 404 = 없음, 200 = 있음, 그 외 = 에러
    const url = `${apiServerAddr}/v1/consents/privacy`;

    // 혹시 이전 요청 있으면 취소
    if (controller) controller.abort();
    controller = new AbortController();

    loading = true;
    errorMsg = "";
    hasConsent = false;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "bizportal-access-token": jwt },
        signal: controller.signal,
      });

      if (res.status === 404) {
        hasConsent = false;
        return;
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`check failed: ${res.status} ${t}`);
      }

      // ✅ 200이면 있다고 판단
      hasConsent = true;

      // ⚠️ 여기서 blob을 읽어버리면 네트워크 2번이 아까울 수 있는데
      // 모달 열 때 최신으로 다시 받아오는 걸 원해서 체크만 하고 끝냄.
      // (만약 1번만 받고 싶으면 여기서 blob 만들어두고 모달에 써도 됨)
    } catch (e) {
      if (e?.name === "AbortError") return;
      console.error(e);
      errorMsg = "동의서 상태를 확인하지 못했습니다.";
    } finally {
      loading = false;
      controller = null;
    }
  }

  async function openPrivacyConsentModal() {
    // ✅ 이전 요청 취소
    if (controller) {
      controller.abort();
      controller = null;
    }

    // ✅ 이전 objectURL 정리
    cleanupImageUrl();

    isViewerOpen = true;
    lockBodyScroll(true);

    imageLoading = true;
    imageError = "";

    controller = new AbortController();

    try {
      const url = `${apiServerAddr}/v1/consents/privacy`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "bizportal-access-token": jwt },
        signal: controller.signal,
      });

      // 모달 오픈 시점에서 404면: “없음”으로 내려야 함
      if (res.status === 404) {
        hasConsent = false;
        imageError = "작성된 동의서가 없습니다.";
        return;
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`image fetch failed: ${res.status} ${t}`);
      }

      const blob = await res.blob();
      imageUrl = URL.createObjectURL(blob);
    } catch (e) {
      if (e?.name === "AbortError") return;
      console.error(e);
      imageError = "동의서를 불러오지 못했습니다.";
    } finally {
      imageLoading = false;
      controller = null;
    }
  }

  function closeViewer() {
    if (controller) {
      controller.abort();
      controller = null;
    }

    isViewerOpen = false;
    imageError = "";
    imageLoading = false;
    cleanupImageUrl();
    lockBodyScroll(false);
  }

  onMount(async () => {
    try {
      jwt = localStorage.getItem("userJwt") || "";
      refresh = localStorage.getItem("refreshJwt") || "";

      await checkHasConsent();
    } catch (err) {
      if (err?.name === "AbortError") return;

      console.error(err);

      try {
        if (err?.message == "21009") {
          await updateRefresh(refresh);
          location.reload();
          return;
        }
      } catch (err2) {
        console.error(err2);
        localStorage.setItem("refreshJwt", "");
        localStorage.setItem("userJwt", "");
        alert("토큰 재발급 오류 발생. 다시 로그인해주세요");
        $isLogin = false;
        goto(urlList.uaLogin);
        return;
      }

      errorMsg = "동의서를 불러오지 못했습니다.";
    }

    // cleanup
    return () => {
      if (controller) controller.abort();
      cleanupImageUrl();
      lockBodyScroll(false);
    };
  });
</script>

<Nav>개인정보 수집 및 이용 동의</Nav>

<section class="contents">
  {#if loading}
    <div class="center-box">
      <div class="loading">불러오는 중...</div>
    </div>

  {:else if errorMsg}
    <div class="center-box">
      <div class="error">{errorMsg}</div>
    </div>

  {:else if hasConsent}
    <!-- ✅ "조회" 카드/버튼만 보여주고, 눌렀을 때 모달로 -->
    <ul class="list">
      <li
        class="item"
        role="button"
        tabindex="0"
        on:click={openPrivacyConsentModal}
        on:keydown={(e) => e.key === "Enter" && openPrivacyConsentModal()}
      >
        <div class="left">
          <div class="title">
            개인정보 수집 및 이용 동의서
            <span class="badge ok">작성됨</span>
          </div>

          <div class="meta">
            <span>조회하려면 클릭하세요</span>
          </div>
        </div>

        <div class="right">
          <span class="chev">›</span>
        </div>
      </li>
    </ul>

  {:else}
    <div class="center-box">
      <div class="empty">작성된 동의서가 없습니다.</div>
    </div>
  {/if}

  <!-- ✅ 모달 -->
  {#if isViewerOpen}
    <div class="modal-backdrop" on:click|self={closeViewer}>
      <div class="modal" on:click|stopPropagation>
        <div class="modal-top">
          <div class="modal-title"></div>
          <button class="close" on:click={closeViewer} aria-label="닫기">✕</button>
        </div>

        <div class="modal-body">
          {#if imageLoading}
            <div class="loading">동의서 불러오는 중...</div>
          {:else if imageError}
            <div class="error">{imageError}</div>
          {:else}
            <img class="doc-img" src={imageUrl} alt="개인정보 동의서" />
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- 작성 버튼 -->
  <button
    style="font-size: 1.2em"
    on:click={gotoWrite}
    class="fixed bottom-6 right-6 mb-24 me-2 rounded-full px-5 py-3 bg-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
  >
    + 새로 작성하기
  </button>
</section>

<style>
  .contents {
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
    padding: 24px 24px 120px;
  }

  .center-box {
    min-height: calc(100vh - 220px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }

  .empty,
  .loading,
  .error {
    padding: 18px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 12px;
    background: #fff;
    font-weight: 700;
    font-size: 1.1em;
    min-width: min(520px, 92vw);
    text-align: center;
  }

  .error {
    color: #991b1b;
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.25);
  }

  /* 리스트 카드 */
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
    padding: 14px;
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
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .badge {
    padding: 4px 8px;
    border-radius: 999px;
    font-weight: 700;
  }
  .badge.ok {
    background: rgba(16, 185, 129, 0.12);
    color: #065f46;
  }

  .meta {
    margin-top: 0.8em;
    color: #374151;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
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
    max-height: 90vh;
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
  .doc-img {
    max-width: 100%;
    max-height: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
    border-radius: 12px;
    background: #fff;
  }
</style>
