<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import { page } from "$app/stores";
  import { footCheck } from "$lib/store/navStore.js";
  import Favorite from "../Favorite.svelte";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  let hsptList = [];
  let favType = "N";
  let mbrId = 0;
  onMount(async () => {
    let dayType = new Date().getDay();
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          mbrId = result;
          const url =
            /*urlAddr + "8082*/ mobileUrlAddr + "/v1/favShop/selectFavHsptListMobile?favYNA=N&dayType=" + dayType;
          let resData = await getAPI(url);
          hsptList = resData.resultVO;
          console.log(hsptList);
        }
      });
    } catch (err) {
      //에러가 토큰기간만료 코드라면 다시 재발급을 진행
      try {
        if (err.message == "21009") {
          await updateRefresh(refresh);
          location.reload();
        } else {
          //아니라면 그냥 에러 출력.
          console.error(err);
        }
      } catch (err) {
        //토큰 재발급 과정에서 에러 발생 시, 다시 로그인하도록 로그인 화면으로 보낸다.
        console.error(err);
        localStorage.setItem("refreshJwt", "");
        localStorage.setItem("userJwt", "");
        alert("토큰 재발급 오류 발생. 다시 로그인해주세요");
        $isLogin = false;
        goto("/mbr/uaLogin");
      }
    }
  });
</script>

<Nav>
  <slot>단골병원</slot>
  <div class="notytab_wrap" slot="btns">
    <button
      type="button"
      on:click={() => {
        goto(urlList.uaFavHsptLst);
      }}>전체</button
    >
    <button
      type="button"
      on:click={() => {
        goto(urlList.favhos);
      }}>단골병원</button
    >
    <button type="button" class="on">방문병원</button>
  </div>
</Nav>

<Favorite {hsptList} {favType} />
