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

  // 상태
  let hasConsent = false; // ✅ 동의서 존재 여부
  let imageUrl = ""; // ✅ blob url
  let loading = true;
  let errorMsg = "";

  // fetch 취소용
  let controller = null;

  function gotoWrite() {
    goto(urlList.newPrivacyConsent);
  }

  function lockBodyScroll(lock) {
    document.body.style.overflow = lock ? "hidden" : "";
    document.body.style.touchAction = lock ? "none" : "";
  }

  async function fetchPrivacyConsentImage() {
    if (controller) controller.abort();
    controller = new AbortController();

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      imageUrl = "";
    }

    loading = true;
    errorMsg = "";
    hasConsent = false;

    try {
      const url = `${apiServerAddr}/v1/consents/privacy`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "bizportal-access-token": jwt },
        signal: controller.signal,
      });

      // errorMsg = "동의서를 불러오지 못했습니다.";

      // ✅ 정상 흐름: "동의서 없음"
      if (res.status === 404) {
        hasConsent = false;
        return;
      }

      // ❌ 진짜 에러
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`image fetch failed: ${res.status} ${t}`);
      }

      // ✅ 정상 흐름: 동의서 있음
      const blob = await res.blob();
      imageUrl = URL.createObjectURL(blob);
      hasConsent = true;
    } catch (e) {
      // abort는 무시
      if (e?.name === "AbortError") return;

      console.error(e);
      errorMsg = "동의서를 불러오지 못했습니다.";
    } finally {
      loading = false;
      controller = null;
    }
  }

  onMount(async () => {
    try {
      jwt = localStorage.getItem("userJwt") || "";
      refresh = localStorage.getItem("refreshJwt") || "";

      await fetchPrivacyConsentImage();
    } catch (err) {
      // abort는 무시
      if (err?.name === "AbortError") return;

      console.error(err);

      // 토큰 만료 코드(너네 규약)
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

    return () => {
      if (controller) controller.abort();
      if (imageUrl) URL.revokeObjectURL(imageUrl);
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
    <!-- ✅ 동의서가 있으면 바로 화면에 표시 -->
    <div class="viewer">
      <img class="doc-img" src={imageUrl} alt="개인정보 동의서" />
    </div>
  {:else}
    <!-- ✅ 동의서가 없으면 중앙 안내 + 작성 버튼 -->
    <div class="center-box">
      <div class="empty">작성된 동의서가 없습니다.</div>
    </div>
  {/if}

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

  /* 중앙 안내 영역 */
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
    padding: 18px 18px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 12px;
    background: #fff;
    font-weight: 500;
    font-size: 1.2em;
    min-width: min(520px, 92vw);
    text-align: center;
  }

  .error {
    color: #991b1b;
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.25);
  }

  /* 뷰어 */
  .viewer {
    max-width: 60%;
    margin: 0 auto;
    background: #fff;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    padding: 14px;
  }

  .doc-img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 12px;
    background: #fff;
  }

  .actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    padding-top: 12px;
  }

  /* 버튼 */
  .btn {
    appearance: none;
    border: 0;
    cursor: pointer;
    padding: 12px 14px;
    border-radius: 12px;
    font-weight: 500;
    font-size: 1em;
  }
  .btn.secondary {
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.18);
  }
  .btn.primary {
    background: #2563eb;
    color: #fff;
  }
  .mt {
    margin-top: 4px;
  }

  /* 세로 화면 */
@media (orientation: portrait) {
  .viewer {
    max-width: 75%;
  }
}
</style>
