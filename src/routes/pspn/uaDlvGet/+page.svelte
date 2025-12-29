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
  import { dlName, dlTel, dlZip, dlAddr, dlAddrDtl, drcpPspnId, drcpShpId } from "$lib/store/pspnStore.js";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  let dlvData = [];
  let dlstName = "";
  let dlstTel = "";
  let dlstZip = "";
  let dlstAddr = "";
  let dlstAddrDtl = "";
  let check = true;
  let returnType = false;
  let popUp = false;
  let mbrId;
  let jwt;
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          mbrId = result;
          const url = /*urlAddr + "8083*/ authUrlAddr + "/v1/member/selectMemberDelivery?mbrId=" + mbrId;
          let resData = await getAPI(url);
          returnType = $page.url.searchParams.get("return");
          dlvData = resData.resultVO;
          console.log(dlvData);
          if (dlvData != null) {
            dlstName = dlvData.dlstName;
            dlstTel = dlvData.dlstTel;
            dlstZip = dlvData.dlstZip;
            dlstAddr = dlvData.dlstAddr;
            dlstAddrDtl = dlvData.dlstAddrDtl;
            check = false;
          }
          checkReturn();
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

  //택배신청 여부 팝업
  function checkPopup() {
    popUp = true;
  }

  //택배신청 등록
  async function regDlv() {
    let jsonStr = makeStr({
      drcpPspnId: $drcpPspnId,
      drcpShpId: $drcpShpId,
      drcpStat: 1,
      drcpDlvType: "P",
      drcpDlvZip: dlstZip,
      drcpDlvAddr: dlstAddr,
      drcpDlvAddrDtl: dlstAddrDtl,
      drcpDlvRcv: dlstName,
      drcpDlvTel: dlstTel,
    });
    const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/dgns/insertDrcpInfo";
    let res = await postAPI(url, jsonStr, jwt);
    console.log(res);
    if (res.resultVO == true) {
      popUp = false;
      $drcpPspnId = "";
      $drcpShpId = "";
      $dlName = "";
      $dlTel = "";
      $dlZip = "";
      $dlAddr = "";
      $dlAddrDtl = "";
      goto(urlList.uaPspnLst);
    }
  }
  // 배송지 리스트 선택에서 돌아온건지 확인
  function checkReturn() {
    if (returnType == "true") {
      console.log($dlName);
      dlstName = $dlName;
      dlstTel = $dlTel;
      dlstZip = $dlZip;
      dlstAddr = $dlAddr;
      dlstAddrDtl = $dlAddrDtl;
      check = false;
    }
  }

  //닫기 버튼
  function xButton() {
    popUp = false;
  }
</script>

<Nav>택배수령</Nav>
<section class="contents">
  <h3 class="big">
    택배수령 정보 <button
      type="button"
      on:click={() => {
        goto(urlList.uaDlvRgst + "?type=P");
      }}
      class="mbtn_b">배송지 선택</button
    >
  </h3>
  <br />
  <div class="box_1">
    <dl class="info_dl">
      <dt class="tit">받는 사람</dt>
      <dd>{dlstName}</dd>
      <dt class="tit">전화번호</dt>
      <dd>{dlstTel}</dd>
      <dt class="tit">주소</dt>
      <dd>[{dlstZip}] {dlstAddr} {dlstAddrDtl}</dd>
      {#if dlvData == null && returnType == false}
        <dt class="wide">배송지를 선택해주세요</dt>
      {:else}
        <dt class="wide">위 정보로 택배를 신청 하시겠습니까?</dt>
      {/if}
    </dl>
  </div>

  <div class="btn_wrap inline">
    <button disabled={check} type="button" class="btn_01" value="택배신청 하시겠습니까?" id="show" on:click={checkPopup}
      >택배신청</button
    >
  </div>
</section>
<PopUp {popUp}>
  <slot
    >택배신청 하시겠습니까? <button type="button" class="alert_close" on:click={xButton}
      ><i class="xi-close-min" /></button
    ></slot
  >
  <p class="btn_wrap" id="btn" slot="btns">
    <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={regDlv}>예</button>
    <button type="button" class="mbtn_n_9" id="close" on:click={xButton}>아니오</button>
  </p>
  <p /></PopUp
>
