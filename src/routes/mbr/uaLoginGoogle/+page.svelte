<script>
  // @ts-nocheck

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
  let error = $page.url.searchParams.get("error");

  let bizportalAccessToken = $page.url.searchParams.get("bizportal-access-token");
  let bizportalRefreshToken = $page.url.searchParams.get("bizportal-refresh-token");

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
    switchVisible();

    //refreshToken 발급 과정
    localStorage.setItem("refreshJwt", bizportalAccessToken);

    localStorage.setItem("userJwt", bizportalRefreshToken);

    localStorage.setItem("logintool", "google");

    //refreshToken 발급 과정
    let jwt = localStorage.getItem("userJwt");
    await getUserId(jwt).then(async (result) => {
      if (result != "" && result != undefined) {
        await getDeviceToken(result);
        //로그인 결과를 추가한다.
        goto(
          urlList.uaAfterJoinCallback +
            "?accessToken=" +
            localStorage.getItem("userJwt") +
            "&refreshToken=" +
            localStorage.getItem("refreshJwt") +
            "&loginType=google"
        );
      } else {
        goto(urlList.uaLogin);
      }
    });
  })
</script>

<div style="display: flex; justify-content: center; align-items: center; min-height: 700px">
  {#if visible}
    <img src="/lib/img/barodoctorKR_txt.png" alt="barodoctor" style="height: 90px;" in:fade out:fade />
  {/if}
</div>
