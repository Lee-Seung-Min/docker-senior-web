<script>
  // @ts-nocheck
  //카카오 로그인 이후 검증하는 페이지

  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { getAPI } from "$lib/js/getAPI";
  import { authUrlAddr } from "$lib//js/urlAddr";
  import { Circle } from "svelte-loading-spinners";
  import { fade, fly } from "svelte/transition";
  import { urlList } from "$lib/urlList";
  import { getUserId } from "$lib/js/getUserId";
  import { getDeviceToken } from "$lib/js/phoneAction";

  let code = $page.url.searchParams.get("code");
  let visible = true;

  function switchVisible() {
    visible = !visible;
  }

  let clear;
  $: {
    clearInterval(clear);
    clear = setInterval(switchVisible, 1000);
  }

  onMount(async () => {
    //카카오 초기화가 되어있지 않다면 초기화 진행
    if (!Kakao.isInitialized()) {
      Kakao.init("61293c54f9207fc7739fb7c9618d457c");
    }

    switchVisible();
    const url = authUrlAddr + "/kakao/login?code=" + code;

    //result가 로그인 성공이면 이동이고 아니면 에러 뜨고 홈화면으로 이동
    try {
      const result = await getAPI(url);
      //다른 소셜 로그인에 가입한 이메일 에러면 로그인 화면으로 되돌아감.
      if (result["error"] != null) {
        alert("다른 소셜 로그인에 가입한 이메일입니다. 다른 소셜 로그인으로 로그인해주세요.");
        goto(urlList.uaLogin);
      }
      //refreshToken 발급 과정
      localStorage.setItem("refreshJwt", result["bizportal-refresh-token"]);

      localStorage.setItem("userJwt", result["bizportal-access-token"]);

      localStorage.setItem("logintool", "kakao");

      //카카오 로그인 엑세스 토큰 저장
      Kakao.Auth.setAccessToken(result["kakaoAccessToken"]);
      //카카오 로그인 리프레시 토큰은 쿠키에 저장

      let jwt = localStorage.getItem("userJwt");
      await getUserId(jwt).then(async (result) => {
        if (result != "" && result != undefined) {
          await getDeviceToken(result);

          //본인인증 여부 확인
          let verified = await getAPI(authUrlAddr + "/v1/member/checkVerified");
          if (verified == "0" || verified == null) {
            //본인인증이 안되있다면 본인인증 페이지로 이동
            goto(urlList.identifyPage);
          } else {
            //아니라면 홈으로
            goto(urlList.uaHome);
          }
        } else {
          //로그인이 잘못됐으면 로그인 페이지로 이동
          alert("토큰오류가 발생했습니다. 계속 해당 오류가 발생할 시 문의 바랍니다.");
          goto(urlList.uaLogin);
        }
      });
    } catch (error) {
      console.error(error);
      alert("로그인 도중 오류가 발생했습니다. 계속 해당 오류가 발생할시 문의 바랍니다.");
      //오류가 날 시 돌아가는 사이트를 정해야함. 현재는 다시 로그인사이트로 이동하게 만듬
      goto(urlList.uaLogin);
    }
  });
</script>

<div style="display: flex; justify-content: center; align-items: center; min-height: 700px">
  {#if visible}
    <img src="/lib/img/barodoctorKR_txt.png" alt="barodoctor" style="height: 90px;" in:fade out:fade />
  {/if}
</div>
