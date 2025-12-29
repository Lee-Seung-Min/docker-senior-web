<script>
  // @ts-nocheck
  //애플 또는 구글 로그인 이후 검증하는 페이지

  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { getAPI } from "$lib/js/getAPI";
  import { authUrlAddr } from "$lib//js/urlAddr";
  import { Circle } from "svelte-loading-spinners";
  import { fade, fly } from "svelte/transition";
  import { urlList } from "$lib/urlList";
  import { getUserId } from "$lib/js/getUserId";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import { postAPI } from "$lib/js/postAPI";
  import { isLogin } from "$lib/store/loginStore";

  const urlParams = $page.url.searchParams;

  let accessToken = urlParams.has("accessToken") ? urlParams.get("accessToken") : "";
  let refreshToken = urlParams.has("refreshToken") ? urlParams.get("refreshToken") : "";
  let loginType = urlParams.has("loginType") ? urlParams.get("loginType") : "";
  let loginError = urlParams.has("loginError") ? urlParams.get("loginError") : "";

  let visible = true;

  function switchVisible() {
    visible = !visible;
  }

  let clear;
  $: {
    clearInterval(clear);
    clear = setInterval(switchVisible, 1000);
  }

  let phone = "";

  let id = "";

  let isNew = false; //이미 상세 고객 정보를 입력한 사람이라면 안보이게하고 아니라면 보이게한다.

  let agree1 = false;
  let agree2 = false;
  let agree3 = false;

  let popUp = false;
  let popupWord = "필수 항목을 입력해주세요.";

  onMount(async () => {
    $isLogin = false;
    switchVisible();

    if (loginError != "") {
      if (loginError == "otherLogin") {
        alert("다른 소셜 로그인에 가입한 이메일입니다. 다른 소셜 로그인으로 로그인해주세요.");
      } else if (loginError == "notJoin") {
        alert("애플 계정 연동이 되었으나 회원가입이 되어있지않습니다. 애플 계정 연동 해제 후 시도해주세요.");
      }
      goto(urlList.uaLogin);
    }

    localStorage.setItem("userJwt", accessToken);

    const url = authUrlAddr + "/kakao/selectMemberInfo";
    try {
      let result = await getAPI(url);
      //사용자 정보를 가져와서 해당 사용자가 id가 있지만 사용자 정보가 부족하다면 추가입력으로
      if (result.mbrTel == "" || result.mbrTel == undefined) {
        id = result.mbrId;
        isNew = true;
      } else {
        //아니라면 jwt를 저장하고 홈으로 이동
        isNew = false;
        localStorage.setItem("userJwt", accessToken);
        localStorage.setItem("refreshJwt", refreshToken);
        localStorage.setItem("logintool", loginType);

        //본인인증이 완료됐는지 확인
        let verified = await getAPI(authUrlAddr + "/v1/member/checkVerified");
        if (verified == "0" || verified == null) {
          //안되있다면 본인인증 페이지로 이동
          goto(urlList.identifyPage);
        } else {
          //되있다면 로그인화면으로 이동해 자동로그인을 실행하도록 함
          goto(urlList.uaLogin);
        }
      }
    } catch (err) {
      //로그인 오류 발생시 로그인 에러 창을 띄우고 로컬스토리지를 초기화하고 로그인페이지로 이동한다.
      console.error(err);
      alert("로그인에 실패했습니다. 로그인 페이지로 이동합니다.");
      localStorage.setItem("userJwt", "");
      localStorage.setItem("refreshJwt", "");
      localStorage.setItem("logintool", "");
      goto(urlList.uaLogin);
    }
  });

  /**
   * 휴대번호 형식으로 자동 변환해주는 함수
   */
  function telBlur() {
    phone = phone.replace(/\D/g, "");
    if (phone.length == 11) {
      phone = phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
    }
  }

  /**
   * 사용자가 입력한 정보를 바탕으로 애플/구글 로그인때 가져올 수 없는 사용자 정보를 가져온다.
   */
  async function updateUserData() {
    try {
      if (agree1 && agree2 && agree3 && phone.length == 13) {
        const url = authUrlAddr + "/kakao/joinAfter";
        const memberData = {
          mbrTel: phone,
          mbrId: id,
        };

        let result = await postAPI(url, JSON.stringify(memberData), accessToken);
        if (result == 1) {
          localStorage.setItem("userJwt", accessToken);
          localStorage.setItem("refreshJwt", refreshToken);
          localStorage.setItem("logintool", loginType);

          //본인인증이 완료됐는지 확인
          let verified = await getAPI(authUrlAddr + "/v1/member/checkVerified");
          if (verified == "0" || verified == null) {
            //안되있다면 본인인증 페이지로 이동
            goto(urlList.identifyPage);
          } else {
            //되있다면 로그인화면으로 이동해 자동로그인을 실행하도록 함
            goto(urlList.uaLogin);
          }
        } else {
          popupWord = "저장에 실패했습니다. 다시 시도해주세요.";
          popUp = false;
        }
      } else {
        popupWord = "필수 항목을 입력해주세요.";
        popUp = true;
      }
    } catch (err) {
      console.error(err);
    }
  }

  function openWindow(url) {
    let popup = window.open(url, "약관", "width=" + screen.width + ",height=" + screen.height + ",fullscreen=yes");
  }
</script>

<section class="contents">
  {#if isNew}
    <div class="form_wrap">
      <h3>가입 완료를 위해서 추가 정보를 입력해주세요.</h3>
      <label>
        <input type="text" required id name bind:value={phone} on:blur={telBlur} maxlength="13" />
        <span>휴대폰 번호(11자리, 필수)</span>
      </label>

      <label class="none" style="font-size: 12px;">
        <input type="checkbox" name id bind:checked={agree1} />
        <span />
        [필수] 개인정보 처리방침
        <a
          href="#none"
          style="color: blue;"
          on:click={() => openWindow("https://sites.google.com/view/barodoctor-privacy-policy/%ED%99%88")}
          >[약관 링크]</a
        >
      </label>

      <label class="none" style="font-size: 12px;">
        <input type="checkbox" name id bind:checked={agree2} />
        <span />
        [필수] 서비스 이용약관
        <a
          href="#none"
          style="color: blue;"
          on:click={() => openWindow("https://sites.google.com/view/barodoctor-service-policy/%ED%99%88")}
          >[약관 링크]</a
        >
      </label>

      <label class="none" style="font-size: 12px;">
        <input type="checkbox" name id bind:checked={agree3} />
        <span />
        [필수] 위치기반 서비스 이용약관
        <a
          href="#none"
          on:click={() => openWindow("https://sites.google.com/view/barodoctor-location-policy/%ED%99%88")}
          style="color: blue;">[약관 링크]</a
        >
      </label>

      <div class="btn_wrap">
        <button
          class="btn_01"
          on:click={() => {
            updateUserData();
          }}
        >
          회원가입 완료
        </button>
      </div>
    </div>
  {:else}
    <div style="display: flex; justify-content: center; align-items: center; min-height: 700px">
      {#if visible}
        <img style="height: 90px;" src="/src/lib/img/barodoctorKR_txt.png" alt="barodoctor" in:fade out:fade />
      {/if}
    </div>
  {/if}
</section>

<PopUp {popUp}>
  <slot>
    <h2>실패</h2>
    <br />{popupWord}
  </slot>
  <div slot="btns" class="btn_wrap">
    <button
      type="button"
      class="btn_04"
      name="chbtn"
      id="visit"
      on:click={() => {
        popUp = false;
      }}
    >
      확인
    </button>
  </div>
</PopUp>
