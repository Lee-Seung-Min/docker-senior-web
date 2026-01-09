<script>
  // @ts-nocheck

  import { apiServerAddr, authUrlAddr } from "$lib//js/urlAddr";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { getAPI } from "$lib/js/getAPI";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { urlList } from "$lib/urlList";
  import { page } from "$app/stores";
  import { postAPI } from "$lib/js/postAPI";
  import { getDeviceToken } from "$lib/js/phoneAction";
  import { slide } from "svelte/transition";

  let fcmToken;
  let businessMenuOpen = false;

  let phoneNum = "";
  let password = "";
  let loading = false;

  let isQuit = $page.url.searchParams.get("quit") ? true : false;

  onMount(async () => {
    localStorage.setItem("userJwt", "");
    localStorage.setItem("refreshJwt", "");
    localStorage.setItem("logintool", "");
    isLogin.set(false);
  });

  let focusCount = 0;
  const onFocus = () => (focusCount += 1);
  const onBlur = () => (focusCount = Math.max(0, focusCount - 1));

  function formatPhone(value) {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  }

  function onInput(e) {
    phoneNum = formatPhone(e.target.value);
  }

  async function handleLoginSubmit() {
    if (!phoneNum || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    if (loading) return;
    loading = true;

    try {
      const url = apiServerAddr + "/v1/auth/ext/loginWithIdPwd";

      const form = new URLSearchParams({
        phoneNum: phoneNum,
        password: password,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: form.toString(),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || `HTTP ${response.status}`);
      }
      const res = await response.json();

      // 백엔드가 토큰만 내려주는 경우를 고려
      const result = res.resultVO || res;
      const accessToken =
        result["bizportal-access-token"] ||
        result["accessToken"] ||
        result["userJwt"];
      const refreshToken =
        result["bizportal-refresh-token"] ||
        result["refreshToken"] ||
        result["refreshJwt"];

      if (!accessToken) {
        alert("로그인 실패: 토큰이 응답에 없습니다.");
        return;
      }

      if (refreshToken) localStorage.setItem("refreshJwt", refreshToken);
      localStorage.setItem("userJwt", accessToken);
      localStorage.setItem("logintool", "basic");
      goto(urlList.uaHome);
    } catch (err) {
      alert("다시 로그인해주세요.");
      goto(urlList.uaLogin);
    } finally {
      loading = false;
    }
  }

  function initGuest() {
    const refreshJwt = !localStorage.getItem("refreshJwt")
      ? ""
      : localStorage.getItem("refreshJwt");
    if (refreshJwt == "guest") localStorage.removeItem("refreshJwt");
  }
</script>

<svelte:head></svelte:head>

<body class="page">
  <main class="center">
    <div class="card">
      <img class="logo" src="/lib/img/namwonLogo.jpg" alt="남원 로고" />

      <form class="form" on:submit|preventDefault={handleLoginSubmit}>
        <div class="field">
          <label for="phoneNum">전화번호</label>
          <input
            id="phoneNum"
            type="text"
            bind:value={phoneNum}
            placeholder="전화번호"
            inputmode="numeric"
            autocomplete="tel"
            on:input={onInput}
            on:focus={onFocus}
            on:blur={onBlur}
          />
        </div>

        <div class="field">
          <label for="password">비밀번호</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="비밀번호"
            autocomplete="current-password"
            on:focus={onFocus}
            on:blur={onBlur}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  </main>

  <!-- 하단 고정 영역 -->
  <footer class="bottom" class:hidden={focusCount > 0}>
    <button
      class="toggle"
      on:click={() => (businessMenuOpen = !businessMenuOpen)}
    >
      사업자 정보 {businessMenuOpen ? "닫기 ⇅" : "열기 ⇅"}
    </button>

    {#if businessMenuOpen}
      <div class="biz" transition:slide>
        <div>주식회사 비트컴퓨터 | CEO: 조현정, 전진옥</div>
        <div>주소: 서울특별시 서초구 서초대로74길 33 (서초동, 비트빌)</div>
        <div>사업자 등록 번호: 220-81-29726 | 문의전화: 02-3487-8585</div>
        <div>이메일: bit.barodoctor@gmail.com</div>
      </div>
    {/if}
  </footer>
</body>

<style>
  :root {
    --primary: #003c82;
    --primary-light: rgba(0, 60, 130, 0.15);
    --border: rgba(0, 0, 0, 0.18);
    --bg-input: #ffffff;
    --text-muted: #666;

    --page-bg: #f6f8fb;
    --card-max: 420px;
    --safe-bottom: 140px; /* footer 영역 + 여유 */
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    height: 100%;
  }

  .page {
    margin: 0;
    min-height: 100vh;
    background: var(--page-bg);

    /* 하단 고정 footer에 가려지지 않게 */
    padding-bottom: var(--safe-bottom);

    /* 폰에서 좌우 안 붙게 안전 여백 */
    padding-left: 16px;
    padding-right: 16px;
  }

  /* 중앙 정렬 */
  .center {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 카드: 최대 폭 + 폰에서도 안 잘리게 */
  .card {
    width: 100%;
    max-width: var(--card-max);
    margin: 16px auto; /* 위아래 여유 */

    padding: 24px;
    border-radius: 20px;
    background: #fff;

    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  }

  /* 로고 */
  .logo {
    width: 180px;
    max-width: 60%;
    display: block;
    margin: 0 auto;
    margin-top: 16px;
  }

  /* 폼 */
  .form {
    display: grid;
    gap: 12px;
  }

  .field {
    display: grid;
    gap: 6px;
  }

  .field label {
    font-size: 14px;
    margin-top: 4px;
    color: rgba(0, 0, 0, 0.7);
  }

  /* 입력 필드 */
  .field input {
    width: 100%;
    padding: 13px 14px;
    margin-top: 4px;
    font-size: 16px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--bg-input);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .field input::placeholder {
    color: var(--text-muted);
  }

  .field input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
    outline: none;
  }

  /* 로그인 버튼 */
  button[type="submit"] {
    width: 100%;
    margin-top: 6px;
    padding: 14px;
    border-radius: 14px;
    border: none;

    background: linear-gradient(180deg, #0a4fa8 0%, #003c82 100%);
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;

    cursor: pointer;
    transition:
      transform 0.08s ease,
      box-shadow 0.15s ease,
      opacity 0.15s;
  }

  button[type="submit"]:active {
    transform: translateY(1px);
    box-shadow: 0 2px 6px rgba(0, 60, 130, 0.35) inset;
  }

  button[type="submit"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* 하단 고정 영역 */
  .bottom {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;

    padding: 12px 14px calc(12px + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  /* 하단 버튼 */
  .toggle {
    width: 100%;
    max-width: var(--card-max);
    margin: 0 auto;
    display: block;

    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: #fff;
    cursor: pointer;
  }

  /* 사업자 정보 */
  .biz {
    max-width: var(--card-max);
    margin: 10px auto 0;
    text-align: center;
    font-size: 12px;
    line-height: 1.45;
    color: rgba(0, 0, 0, 0.78);
  }

  .bottom.hidden {
    display: none;
  }

  /* 작은 화면 최적화 */
  @media (max-width: 360px) {
    .card {
      padding: 20px 16px 22px;
      border-radius: 18px;
    }

    .field input {
      padding: 12px 12px;
      font-size: 14px;
    }

    button[type="submit"] {
      padding: 13px;
      font-size: 15px;
    }

    .logo {
      width: 160px;
    }
  }
</style>
