<script>
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";

  // @ts-nocheck
  import { createEventDispatcher } from "svelte";
  export let sectionClass = "z_alert";
  export let resvPopUp = false;
  export let hsptType = { ctlsDgns: false, ctlsRsv: false, vstDgns: false, vstRsv: false, ctls: false, visit: false };
  let dgns = false;
  export let ctls = true;
  let popUp = false;
  let text = "";
  export let setDgnsType = "";
  export let timeData = { vacation: false, U: false, V: false, W: false, R: false };
  export let shpId = "";

  const dispatch = createEventDispatcher();
  //팝업 닫기
  function xButton() {
    resvPopUp = false;
    text = "";
  }
  async function doTodayReg() {
    if (timeData.vacation) {
      text = "병원 휴무입니다.";
      popUp = true;
    } else {
      doReg();
    }
  }
  function doReg() {
    if (dgns == true && ctls == true) {
      //비대면 접수
      if (!hsptType.ctlsDgns) {
        text = "비대면접수 불가합니다.";
        popUp = true;
      } else if (!timeData.U) {
        text = "접수시간 종료";
        popUp = true;
      } else {
        setDgnsType = "U";
        dispatch("dgnsEvent");
      }
    } else if (dgns == true && ctls == false) {
      //방문 접수
      if (!hsptType.vstDgns) {
        text = "방문접수 불가합니다.";
        popUp = true;
      } else if (!timeData.V) {
        text = "접수시간 종료";
        popUp = true;
      } else {
        setDgnsType = "V";
        dispatch("dgnsEvent");
      }
    } else if (dgns == false && ctls == true) {
      //비대면 예약
      if (!hsptType.ctlsRsv) {
        text = "비대면예약 불가합니다.";
        popUp = true;
      } else if (hsptType.ctlsRsv) {
        setDgnsType = "U";
        dispatch("rsvEvent");
      }
    } else if (dgns == false && ctls == false) {
      //방문 예약
      if (!hsptType.vstRsv) {
        text = "방문예약 불가합니다.";
        popUp = true;
      } else if (hsptType.vstRsv) {
        setDgnsType = "V";
        dispatch("rsvEvent");
      }
    }
  }
</script>

<!--팝업 창-->
{#if resvPopUp}
  <section class={sectionClass}>
    <div class="bg" />
    <div class="box_1">
      <p class="tex">
        {#if hsptType.ctlsDgns == true || hsptType.ctlsRsv || hsptType.vstDgns || hsptType.vstRsv}
          어느방식을 선택하겠습니까? <br />
        {:else}
          접수/예약이 불가능합니다.
        {/if}
        {#if hsptType.ctls && hsptType.visit}
          대면 진료를 원할 경우 비대면 체크를 해제해 주세요.<br />
          <br />
        {/if}
        <button type="button" class="alert_close" on:click={xButton}> <i class="xi-close-min" /></button>
      </p>
      {#if hsptType.ctls && hsptType.visit}
        <label><input type="checkbox" bind:checked={ctls} /><span />비대면</label>
        <br />
        <br />
      {/if}
      <div class="btn_wrap inline">
        {#if hsptType.ctlsDgns == true || hsptType.vstDgns == true}
          <button
            type="button"
            class="btn_02"
            name="chbtn"
            id="visit"
            on:click={() => {
              dgns = true;
              doTodayReg();
            }}
          >
            {#if ctls == true}
              비대면
            {/if}
            접수
          </button>
        {/if}
        {#if hsptType.ctlsRsv == true || hsptType.vstRsv == true}
          <button
            type="button"
            class="btn_01"
            name="chbtn"
            id="remote"
            on:click={() => {
              dgns = false;
              doReg();
            }}
          >
            {#if ctls == true}
              비대면
            {/if}
            예약</button
          >
        {/if}
      </div>

      {#if popUp}
        <br />
        <div class="text_wrap">
          <div>{text}</div>
          <button
            class="detail"
            on:click={() => {
              resvPopUp = false;
              popUp = false;
              goto(urlList.uaHptDtl + "?shpId=" + shpId + "&shpType=shp");
            }}>자세히 보기</button
          >
        </div>
      {/if}
    </div>
  </section>
{/if}
