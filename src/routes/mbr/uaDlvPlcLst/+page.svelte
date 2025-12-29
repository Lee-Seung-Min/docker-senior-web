<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { authUrlAddr } from "$lib/js/urlAddr";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";

  let jwt = "";
  let refresh = "";

  /**
   * 배송지 리스트
   */
  let dlvList = [];

  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    refresh = localStorage.getItem("refreshJwt");
    try {
      const url = authUrlAddr + "/v1/member/selectMemberDeliveryList";
      const result = await getAPI(url, jwt);
      dlvList = result;
    } catch (err) {
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
        goto(urlList.uaLogin);
      }
    }
  });

  /**
   * 이 배송지를 기본 배송지로 변경하기
   * @param dlstId 배송지id
   */
  async function changeDefault(dlstId) {
    const url = authUrlAddr + "/v1/member/setMemberDeliveryDefault?id=" + dlstId;
    const result = await getAPI(url);

    if (result > 0) {
      const url2 = authUrlAddr + "/v1/member/selectMemberDeliveryList";
      const result2 = await getAPI(url2, jwt);

      dlvList = result2;
    }
  }
</script>

<Nav>배송지 목록 관리</Nav>
<section class="contents">
  {#each dlvList as dlv}
    <div class="box_1" style="padding: 20px">
      <div>
        {#if dlv.dlstDftYon == "Y"}
          <span style="color: skyblue">[기본]</span>
        {/if}
        <span class="address_name">{dlv.dlstName}</span>
        <div>{dlv.dlstAddr}</div>
        <div>{dlv.dlstAddrDtl}</div>
        <div>{dlv.dlstTel}</div>
      </div>
      <div class="ar box">
        {#if dlv.dlstDftYon != "Y"}
          <button class="mbtn_n_3" on:click={() => changeDefault(dlv.dlstId)}>기본</button>
        {/if}
        <button class="mbtn_n_3" on:click={() => goto(urlList.uaDlvPlcMng + "?id=" + dlv.dlstId)}>수정</button>
      </div>
    </div>
  {/each}

  <div class="bottom_btn_fixed">
    <button class="btn_01" on:click={() => goto(urlList.uaDlvPlcMng + "?id=-1")}> 배송지 추가 </button>
  </div>
</section>
