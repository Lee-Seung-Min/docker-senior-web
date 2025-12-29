<script>
  // @ts-nocheck

  import { goto } from "$app/navigation";

  import { page } from "$app/stores";
  import { getAPI } from "$lib/js/getAPI";
  import { authUrlAddr } from "$lib/js/urlAddr";
  import { isLogin } from "$lib/store/loginStore";
  import { urlList } from "$lib/urlList";
  import { onMount } from "svelte";

  let apiToekn = $page.url.searchParams.get("apiToken")?.trim();
  let apiCertNum = $page.url.searchParams.get("certNum");

  let returnPage = ""; //본인인증 완료 후 이동해야할 페이지

  let appear = false;

  onMount(async () => {
    $isLogin = false;
    if (apiToekn == null || apiCertNum == null) {
      localStorage.setItem("userJwt", "");
      localStorage.setItem("refreshJwt", "");
      localStorage.setItem("logintool", "");
      alert("본인인증 오류가 발생했습니다. 해당 오류가 계속 발생하면 문의 바랍니다.");
      //이후 이동할 페이지로 이동
      goto(urlList.uaLogin);
      return;
    }

    await getAPI(authUrlAddr + "/identify/decrypIdentify?apiToken=" + apiToekn + "&apiCertNum=" + apiCertNum)
      .then((res) => {
        console.log(res);
        if (res == "" || res == null) {
          //본인인증에 실패하면 로그인을 풀고 로그인 화면으로 이동한다.
          localStorage.setItem("userJwt", "");
          localStorage.setItem("refreshJwt", "");
          localStorage.setItem("logintool", "");
          alert("본인인증에 실패했습니다. 로그인 화면으로 돌아갑니다.");
          goto(urlList.uaLogin);
        } else {
          appear = true;
        }
      })
      .catch((err) => {
        console.error(err);
        localStorage.setItem("userJwt", "");
        localStorage.setItem("refreshJwt", "");
        localStorage.setItem("logintool", "");
        alert("본인인증 과정 중 오류가 발생했습니다. 계속 해당 오류 발생시 문의 바랍니다. 로그인 화면으로 돌아갑니다.");
        goto(urlList.uaLogin);
      });
  });
</script>

{#if appear}
  <body class="on login">
    <div style="margin-top: 30px;">
      <div class="identifyTitle">휴대폰 본인인증 완료</div>
      <div class="identifyContent">본인인증이 완료되었습니다.</div>

      <div class="btn_wrap" style="position: absolute; bottom: 0; width: 100%;">
        <button class="btn_01" on:click={() => goto(urlList.uaHome)}>홈으로 이동</button>
      </div>
    </div>
  </body>
{/if}

<style>
  .identifyTitle {
    padding: 30px 15px;
    font-size: 20px;
    color: #0fa5d4;
    font-weight: bold;
  }

  .identifyContent {
    font-size: 15px;
    padding: 0 15px 30px 15px;
  }
</style>
