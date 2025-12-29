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
  import { footCheck } from "$lib/store/navStore.js"; //밑에 메뉴바 변경 가능하도록
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  let popUp = false;
  let drcpId;
  let pay = [];
  onMount(async () => {
    drcpId = $page.url.searchParams.get("drcpId");
    const url = /*urlAddr + "8081*/ adminUrlAddr + "/v1/payinfo/drcpPayInfo?drcpId=" + drcpId;
    let resData = await getAPI(url);
    pay = resData.resultVO;
    console.log(pay);
  });
  //팝업 닫기
  function xButton() {
    popUp = false;
  }
</script>

<Nav>처방전 결제</Nav>
<section class="contents">
  <div class="box_1">
    <dl class="info_dl">
      <dt>약국명</dt>
      <dd>{pay.drcpShpName}</dd>
      <dt>조제비</dt>
      <dd>{pay.drcpFee}원</dd>
      <dt>배송비</dt>
      <dd>{pay.drcpDlvFee}원</dd>
      <dt>총 결제 금액</dt>
      <dd>{pay.drcpPay}원</dd>
    </dl>
  </div>

  <div class="btn_wrap inline">
    <button
      type="button"
      class="btn_01"
      id="show"
      on:click={() => {
        popUp = true;
      }}
      value="결제모듈">결제하기</button
    >
  </div>
</section>
<!-- content E -->
<PopUp {popUp}>
  <slot>
    결제 모듈 <button type="button" class="alert_close" on:click={xButton}> <i class="xi-close-min" /></button>
  </slot>

  <p class="btn_wrap" id="btn" slot="btns">
    <button
      type="button"
      class="mbtn_n_4"
      name="chbtn"
      id="close"
      on:click={() => {
        goto(urlList.uaPspnLst);
      }}>예</button
    >
  </p>
  <p />
</PopUp>
