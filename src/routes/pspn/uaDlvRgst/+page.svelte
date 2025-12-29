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
  import { dlName, dlTel, dlZip, dlAddr, dlAddrDtl } from "$lib/store/pspnStore.js";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  let dlvList = [];
  let type;
  let memberId;
  onMount(async () => {
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          type = $page.url.searchParams.get("type");
          const url = /*urlAddr + "8083*/ authUrlAddr + "/v1/member/selectMemberDeliveryList?memberid=" + jwt;
          let resData = await getAPI(url, jwt);
          dlvList = resData;
          console.log(dlvList);
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

<Nav>배송지 선택</Nav>
<section class="contents">
  {#each dlvList as dlv}
    <div class="box_1" style="padding: 20px">
      <div>
        <span class="address_name">{dlv.dlstName}</span>
        <div>[{dlv.dlstZip}] {dlv.dlstAddr}</div>
        <div>{dlv.dlstAddrDtl}</div>
        <div>{dlv.dlstTel}</div>
      </div>
      <div class="ar">
        <button
          type="button"
          on:click={() => {
            $dlName = dlv.dlstName;
            $dlTel = dlv.dlstTel;
            $dlZip = dlv.dlstZip;
            $dlAddr = dlv.dlstAddr;
            $dlAddrDtl = dlv.dlstAddrDtl;
            if (type == "P") {
              goto(urlList.uaDlvGet + "?return=true");
            } else if (type == "Q") {
              goto(urlList.uaQGet + "?return=true");
            }
          }}
          class="mbtn_b">선택</button
        >
      </div>
    </div>
  {/each}
  <div class="btn_wrap">
    <button
      class="btn_01"
      on:click={() => {
        goto(urlList.uaDlvPlcMng + "?id=-1&pspn=true&type=" + type);
      }}
    >
      배송지 추가
    </button>
  </div>
</section>
