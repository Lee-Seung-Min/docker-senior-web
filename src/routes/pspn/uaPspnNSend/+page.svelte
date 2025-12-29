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
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { drcpPspnId } from "$lib/store/pspnStore.js";
  import { getUserId } from "$lib/js/getUserId";
  import { updateRefresh } from "$lib/js/updateRefresh";
  let pspnLst = [];
  let mbrId;
  onMount(async () => {
    $footCheck = "menu2";
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          mbrId = result;
          const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/pspn/selectNsendPspn?mbrId=" + mbrId;
          let resData = await getAPI(url);
          pspnLst = resData.resultVO;
          console.log(pspnLst);
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
        goto("/mbr/uaLogin");
      }
    }
  });
</script>

<!--미전송된 처방전 목록-->
<Nav>처방 목록</Nav>
<section class="contents">
  <div class="list_box" id="pre_list">
    {#each pspnLst as pspn}
      <!-- 처방전 정보 S -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="box_1" on:click={() => goto(urlList.uaPspnDtl + "?pspnId=" + pspn.pspnId)}>
        <div class="pspnLst">
          <p class="name">
            {pspn.hsptName}
          </p>
          <br />
          <p class="data">처방&nbsp;{pspn.rsvDttm}</p>
          <div class="ar box3">
            <span
              class="mbtn_g"
              on:click|stopPropagation={() => {
                $drcpPspnId = pspn.pspnId;
                goto(urlList.uaPspnRgst1);
              }}>미전송</span
            >
          </div>
        </div>
      </div>
      <!-- 처방전 정보 E -->
    {/each}
    {#if pspnLst.length == 0}
      <div class="box_1">
        <div class="pspnLst">
          <p class="name">미전송된 처방전이 없습니다.</p>
        </div>
      </div>
    {/if}
  </div>
</section>
<!-- content E -->
