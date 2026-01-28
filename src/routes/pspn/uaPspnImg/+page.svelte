<script>
  // @ts-nocheck

  import { onMount, onDestroy } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import { page } from "$app/stores";
  import { footCheck } from "$lib/store/navStore.js";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { getFetch } from "$lib/js/getFetch";

  let pspnId;
  let imgUrl;
  let imgBlob = null;
  let scale = 1;
  let popUpWhat;
  let popUp=false;
  let faxNumber = '';

    // ObjectURL 메모리 누수 방지
  function revokeImgUrl() {
    if (imgUrl && imgUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imgUrl);
    }
  }

  onMount(async () => {
    pspnId = $page.url.searchParams.get("pspnId");
    $footCheck = "menu2";
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          getPhoto();
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

  onDestroy(() => {
    revokeImgUrl();
  });

  async function getPhoto() {
    if (!pspnId) return;

    try {
      const jwt = localStorage.getItem("userJwt");
      if (!jwt) throw new Error("JWT missing");

      const url = `${mobileUrlAddr}/v1/pspn/getPspnImg?id=${pspnId}&isDgnsId=false`;

      const res = await fetch(url, {
        headers: {
          "bizportal-access-token": jwt
        }
      });

      if (!res.ok) throw new Error(`이미지 로드 실패: ${res.status}`);
      const blob = await res.blob();

      // 기존 URL 정리 후 새 URL 생성
      revokeImgUrl();
      imgUrl = URL.createObjectURL(blob);
    } catch (e) {
      console.error(e);
      alert("처방전을 불러오지 못했습니다.");
    }
  }
  // 확대 함수
  function zoomIn() {
    scale *= 1.3; // 확대 비율을 30% 증가
  }

  // 축소 함수
  function zoomOut() {
    scale /= 1.3; // 확대 비율을 30% 감소
  }

</script>

<Nav>전자처방전</Nav> 
<section class="contents">
  <div style="width: 100%; height: calc(100vh - 200px); position: relative;">
    <div class="pspn-container" style="overflow: auto;">
      <!-- svelte-ignore a11y-missing-attribute -->
      <img src={imgUrl} style="transform: scale({scale});transform-origin:  top left;" />
    </div>
    <div class="zoom-controls">
      <button class="plus" on:click={zoomIn}></button>
      <button class="minus" on:click={zoomOut}></button>
    </div>
  </div>
</section>