<script>
  // @ts-nocheck

  import { authUrlAddr } from "$lib//js/urlAddr";
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

  // 튜토리얼 팝업(디폴트 false예정)
  let isPopUp = false;

  // 튜토리얼 이미지 목록 상태
  const imgFront = "/lib/img/tutorialManual/barodoctorManual";
  let imgList = [
    imgFront + "01.png",
    imgFront + "02.png",
    imgFront + "03.png",
    imgFront + "04.png",
    imgFront + "05.png",
    imgFront + "06.png",
    imgFront + "07.png",
    imgFront + "08.png",
    imgFront + "09.png",
    imgFront + "10.png",
  ];
  let imgLen = imgList.length;
  let currId = 0;
  let positionLeft = 0;
  let startX = 0;

  function handlePointerDown(e) {
    startX = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerUp(e) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    const endX = e.clientX;
    const dragOffset = endX - startX;

    if (dragOffset > 50) {
      prev();
    } else if (dragOffset < -50) {
      next();
    }
  }

  // ID/PW 로그인 폼 상태
  let phoneNum = "";
  let password = "";
  let loading = false;

  let isQuit = $page.url.searchParams.get("quit") ? true : false;

  onMount(async () => {});

  function clickHandler() {
    businessMenuOpen = !businessMenuOpen;
  }

  async function handleLoginSubmit() {
    if (!phoneNum || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    if (loading) return;
    loading = true;
    try {
      const url = authUrlAddr + "/v1/auth/ext/loginWithIdPwd";

      // x-www-form-urlencoded로 변경
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
        result["bizportal-access-token"] || result["accessToken"] || result["userJwt"];
      const refreshToken =
        result["bizportal-refresh-token"] || result["refreshToken"] || result["refreshJwt"];

      


      if (!accessToken) {
        alert("로그인 실패: 토큰이 응답에 없습니다.");
        return;
      }

      if (refreshToken) localStorage.setItem("refreshJwt", refreshToken);
      localStorage.setItem("userJwt", accessToken);
      localStorage.setItem("logintool", "basic");

      goto(urlList.uaHome);
    } catch (err) {
        //토큰 재발급 과정에서 에러 발생 시, 다시 로그인하도록 로그인 화면으로 보낸다.
      alert("로그인 중 오류가 발생했습니다.");
        localStorage.setItem("userJwt", "");
        alert("토큰 재발급 오류 발생. 다시 로그인해주세요");
        $isLogin = false;
        goto(urlList.uaLogin);
    } finally {
      loading = false;
    }
  }

  function moveSlider() {
    positionLeft = currId * 100; //100은 사진 옮겨지지 위한 위치(width)
  }

  function getIndex(index) {
    currId = index;
    moveSlider();
  }

  function next() {
    currId = currId == imgLen - 1 ? 0 : currId + 1;
    moveSlider();
  }
  function prev() {
    currId = currId == 0 ? imgLen - 1 : currId - 1;
    moveSlider();
  }

  function skip() {
    localStorage.setItem("firstBaro", false);
    isPopUp = false;
  }

  function popupClose() {
    isPopUp = false;
  }

  function initGuest() {
    const refreshJwt = !localStorage.getItem("refreshJwt") ? "" : localStorage.getItem("refreshJwt");
    if (refreshJwt == "guest") localStorage.removeItem("refreshJwt");
  }
</script>

<svelte:head></svelte:head>

<body class="on login">
  <div class="loginDiv">
    <div class="login_title">
      <h1 class="blind">비트 닥터</h1>
    </div>
    <div class="bottomSection">
      <form class="idpw-form" on:submit|preventDefault={handleLoginSubmit}>
        <div class="field">
          <label for="phoneNum">전화번호</label>
          <input id="phoneNum" type="text" bind:value={phoneNum} placeholder="전화번호" autocomplete="username" />
        </div>
        <div class="field">
          <label for="password">비밀번호</label>
          <input id="password" type="password" bind:value={password} placeholder="비밀번호" autocomplete="current-password" />
        </div>
        <button type="submit" class="btn_loginBtn" style="width: 300px;" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    <div class="bottomMain">
      <div>
        <button on:click={clickHandler}>사업자 정보 열기 ⇅</button>
      </div>
      {#if businessMenuOpen}
        <div transition:slide style="">
          <div class="bottomDiv">주식회사 비트컴퓨터 | CEO: 조현정, 전진옥</div>
          <div class="bottomDiv">주소: 서울특별시 서초구 서초대로74길 33 (서초동, 비트빌)</div>
          <div class="bottomDiv">사업자 등록 번호: 220-81-29726 | 문의전화: 02-3487-8585</div>
          <div>이메일: bit.barodoctor@gmail.com</div>
        </div>
      {/if}
      </div>
    </div>
  </div>
    
  {#if isPopUp}
    <div class="tutorialModal">
      <div class="tutorial">
        <div
          class="slider"
          style="left: -{positionLeft}%;"
          on:pointerdown={handlePointerDown}
          on:pointerup={handlePointerUp}
        >
          {#each imgList as link}
            <img src={new URL(link, import.meta.url).href} alt="" />
          {/each}
        </div>
        <div class="arrow">
          <button on:click={prev} class="prev">&lt;</button>
          <button on:click={next} class="next">&gt;</button>
        </div>
        <div class="papagination">
          {#each imgList as _, i}
            <button class={currId == i ? "active" : ""} on:click={() => getIndex(i)}></button>
          {/each}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; z-index: 10; background-color: skyblue;">
        <button style="border-right: solid 2px black;" class="tutorialBottom" on:click={popupClose}>닫기</button>
        <button class="tutorialBottom" on:click={skip}>다시 보지 않기</button>
      </div>
    </div>
  {/if}
</body>

<style>

.idpw-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.idpw-form .field {
  display: flex;
  flex-direction: column;
  width: 300px;
}
.idpw-form .field label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.idpw-form .field input {
  height: 44px;
  padding: 0 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* 구글 버튼 디자인 */


  /* 사업자 정보 줄간격  */
  .bottomDiv {
    padding-bottom: 3px;
    line-height: 1.4;
  }

  /* 사업자 정보 열기 부분 */
  .bottomMain {
    width: 100%;
    text-align: center;
    margin-top: 20px; /* 로그인 버튼과 '사업자 정보 열기' 버튼 사이 간격 */
    font-size: 14px;
    color: #666;
  }

  .bottomMain button {
    color: #666;
    margin-bottom: 10px; /* 정보가 열릴 때의 간격 */
  }

  .tutorialModal {
    position: fixed;
    top: 50%;
    left: 0;
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
    /* height: 100%; */
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .tutorial {
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 400px;
    overflow: hidden;
  }

  .slider {
    display: flex;
    position: relative;
    transition: left 0.5s;
    max-width: 400px;
    touch-action: none;
  }

  .slider img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    flex-shrink: 0;
  }
  .arrow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    width: 100%;
    height: 90%;
    top: 0;
    pointer-events: none;
  }
  .arrow button {
    margin-bottom: 0;
    padding: 12px;
    border: 0;
    background-color: rgba(226, 226, 226, 0.7);
    cursor: pointer;
    pointer-events: auto;
  }

  .papagination {
    position: absolute;
    top: 10px;

    width: 100%;
    text-align: center;
  }

  .papagination button {
    margin: 0 4px;
    width: 14px;
    height: 14px;
    border: solid 1px;
    border-radius: 75px;
    background-color: rgba(255, 255, 255, 0.8);
    text-align: center;
    cursor: pointer;
  }
  .papagination .active {
    border: 0;
    background-color: rgba(255, 0, 0, 0.8);
  }

  .tutorialBottom {
    font-size: 15px;
    text-align: center;
    padding: 5px 0;
    width: 50%;
    margin: auto;
  }
</style>
