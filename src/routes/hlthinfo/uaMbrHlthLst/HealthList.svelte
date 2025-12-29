<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import HealthPopUp from "$lib/sub/nav/HealthPopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import { page } from "$app/stores";
  import { footCheck } from "$lib/store/navStore.js";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import { getDow } from "$lib/js/dateFunction";
  import { chngDateFormat, getCurrentDay, getCurrentTime, getMaxDate, getMonthAgo } from "$lib/js/dateFunction";

  let healthList = [];
  let date;
  let mbpDateString;
  let slvlDateString;
  let wgtDateString;
  let tmprDateString;
  let ibdyDateString;
  let popUp = false;
  let popUpWhat = "";
  let mbpChkDttm;
  let mbpPuls;
  let mbpSbp;
  let mbrDbp;
  let slvlChkDttm;
  let slvlData;
  let slvlMealBoa;
  let wgtChkDttm;
  let wgtData;
  let wgtBmi;
  let wgtHeight;
  let tmprChkDttm;
  let tmprData;
  let tmprSatu;
  let ibdyChkDttm;
  let ibdyFatr;
  let ibdyBmi;
  let mbrId;
  let jwt;
  let chkDay;
  let chkTime;
  let rstStr;
  let wrtPopUp = false;
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          mbrId = result;
          const url = /*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/uaMbrHlthLst";
          let resData = await getAPI(url);
          healthList = resData.resultVO;

          date = new Date();
          if (healthList.mbpChkDttm != null) {
            mbpDateString = new Date(healthList.mbpChkDttm);
            mbpDateString = getDateString(date, mbpDateString);
          }
          if (healthList.slvlChkDttm != null) {
            slvlDateString = new Date(healthList.slvlChkDttm);
            slvlDateString = getDateString(date, slvlDateString);
          }
          if (healthList.wgtChkDttm != null) {
            wgtDateString = getDateString(date, new Date(healthList.wgtChkDttm));
            wgtHeight = healthList.wgtHeight;
          }
          if (healthList.tmprChkDttm != null) {
            tmprDateString = getDateString(date, new Date(healthList.tmprChkDttm));
          }
          if (healthList.ibdyChkDttm != null) {
            ibdyDateString = getDateString(date, new Date(healthList.ibdyChkDttm));
          }
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
  function getDateString(e1, e2) {
    if (areDatesEqual(e1, e2)) {
      return "오늘 " + ("0" + e2.getHours()).slice(-2) + ":" + ("0" + e2.getMinutes()).slice(-2);
    } else {
      return (
        ("0" + e2.getFullYear()).slice(-2) +
        "년 " +
        ("0" + (e2.getMonth() + 1)).slice(-2) +
        "월 " +
        ("0" + e2.getDate()).slice(-2) +
        "일 (" +
        getDow(e2) +
        ") " +
        ("0" + e2.getHours()).slice(-2) +
        ":" +
        ("0" + e2.getMinutes()).slice(-2)
      );
    }
  }
  function areDatesEqual(date1, date2) {
    // 년, 월, 일을 비교
    const isSameYear = date1.getFullYear() === date2.getFullYear();
    const isSameMonth = date1.getMonth() === date2.getMonth();
    const isSameDay = date1.getDate() === date2.getDate();

    // 년, 월, 일이 모두 동일한지 확인
    if (isSameYear && isSameMonth && isSameDay) {
      return true; // 동일한 날짜
    } else {
      return false; // 다른 날짜
    }
  }

  function xButton() {
    popUp = false;
  }
  async function doWrtBp() {
    mbpChkDttm = chkDay + " " + chkTime;
    if (
      mbpPuls != undefined &&
      mbpPuls != "" &&
      !isNaN(mbpPuls) &&
      mbpSbp != undefined &&
      mbpSbp != "" &&
      !isNaN(mbpSbp) &&
      mbrDbp != undefined &&
      mbrDbp != "" &&
      !isNaN(mbrDbp)
    ) {
      let jsonStr = makeStr({ mbpChkDttm, mbpMbrId: mbrId, mbpPuls, mbpSbp, mbrDbp });
      if (res.resultVO == true) {
        popUp = false;
        mbpPuls = "";
        mbpSbp = "";
        mbrDbp = "";
        location.reload();
      }
    } else {
      rstStr = "";
      if (mbpPuls == undefined || mbpPuls == "" || isNaN(mbpPuls)) {
        rstStr += "맥박 ";
      }
      if (mbpSbp == undefined || mbpSbp == "" || isNaN(mbpSbp)) {
        rstStr += "수축기 ";
      }
      if (mbrDbp == undefined || mbrDbp == "" || isNaN(mbrDbp)) {
        rstStr += "이완기 ";
      }
      wrtPopUp = true;
    }
  }
  async function doWrtBs() {
    slvlChkDttm = chkDay + " " + chkTime;
    if (slvlData != undefined && slvlData != "" && !isNaN(slvlData)) {
      let jsonStr = makeStr({ slvlChkDttm, slvlMbrId: mbrId, slvlMealBoa, slvlData });
      let res = await postAPI(/*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/addMbrBs", jsonStr, jwt);

      if (res.resultVO == true) {
        popUp = false;
        slvlData = "";
        location.reload();
      }
    } else {
      rstStr = "혈당 ";
      wrtPopUp = true;
    }
  }
  async function doWrtWgt() {
    wgtChkDttm = chkDay + " " + chkTime;
    if (
      wgtData != undefined &&
      wgtData != "" &&
      !isNaN(wgtData) &&
      wgtHeight != undefined &&
      wgtHeight != "" &&
      !isNaN(wgtHeight)
    ) {
      let jsonStr = makeStr({ wgtChkDttm, wgtMbrId: mbrId, wgtData, wgtHeight });
      let res = await postAPI(/*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/addMbrWgt", jsonStr, jwt);

      if (res.resultVO == true) {
        popUp = false;
        wgtData = "";
        location.reload();
      }
    } else {
      rstStr = "";
      if (wgtData == undefined || wgtData == "" || isNaN(wgtData)) {
        rstStr += "체중 ";
      }
      if (wgtHeight == undefined || wgtHeight == "" || isNaN(wgtHeight)) {
        rstStr += "키 ";
      }
      wrtPopUp = true;
    }
  }
  async function doWrtTemp() {
    tmprChkDttm = chkDay + " " + chkTime;
    if (
      tmprData != undefined &&
      tmprData != "" &&
      !isNaN(tmprData) &&
      tmprSatu != undefined &&
      tmprSatu != "" &&
      !isNaN(tmprSatu)
    ) {
      let jsonStr = makeStr({ tmprChkDttm, tmprMbrId: mbrId, tmprData, tmprSatu });
      let res = await postAPI(/*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/addMbrTmpr", jsonStr, jwt);

      if (res.resultVO == true) {
        popUp = false;
        tmprData = "";
        tmprSatu = "";
        location.reload();
      }
    } else {
      rstStr = "";
      if (tmprData == undefined || tmprData == "" || isNaN(tmprData)) {
        rstStr += "체온 ";
      }
      if (tmprSatu == undefined || tmprSatu == "" || isNaN(tmprSatu)) {
        rstStr += "산소포화도 ";
      }
      wrtPopUp = true;
    }
  }
  async function doWrtBMI() {
    ibdyChkDttm = chkDay + " " + chkTime;
    if (ibdyFatr != undefined && ibdyFatr != "" && !isNaN(ibdyFatr)) {
      let jsonStr = makeStr({ ibdyChkDttm, ibdyMbrId: mbrId, ibdyFatr, ibdyStat: "정상" });
      let res = await postAPI(/*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/addMbrIbdy", jsonStr, jwt);

      if (res.resultVO == true) {
        popUp = false;
        ibdyFatr = "";
        location.reload();
      }
    } else {
      rstStr = "체지방률";
      wrtPopUp = true;
    }
  }
  // 현재 날짜와 시간을 가져오는 함수
  function getCurrentDateTime() {
    chkDay = getCurrentDay();
    chkTime = getCurrentTime();
  }
</script>

<!--추후 고려
    <div class="divTog">
      <input type="checkbox" id="toggle" hidden />
      <label for="toggle" class="toggleSwitch">
        <span class="toggleButton" />
      </label> -->
<!-- svelte-ignore a11y-label-has-associated-control -->
<!--
      <label class="txt">
        <p>진료병원 공유</p>
      </label>
    </div>
  -->
<div class="list_box my_info" id="noti">
  <div class="my_info_item">
    <label>
      <div style="display: flex; justify-content: space-between;">
        <p class="hlthinfo">
        국가검진 문진표
        </p>
        <span style="padding: 3% 0%; font-size: 1rem;">
          마지막 작성일자:
        </span>
      </div>
      
    </label>
    <div class="box_1" style="padding: 10px 20px">
      <button style="height: 50px; width: 100%; border: 1px solid; border-radius: 10px;" on:click={()=>goto(urlList.uaMbrQuestion)}>일반 검진 작성하기</button>
    </div>
  </div>

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="my_info_item" on:click={() => goto(urlList.uaMbrBP)}>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="">
      <p class="hlthinfo">
        혈압 &nbsp;&nbsp;
        {#if healthList.mbpStat != null}
          <span class="mbtn_b">
            {healthList.mbpStat}
          </span>
        {/if}
      </p>
    </label>
    <div class="box_1">
      {#if healthList.mbpPuls == null && healthList.mbpSbp == null}
        <p class="tit" style="padding: 10px 0px;">기록해주세요</p>
      {:else}
        {#if healthList.mbpSbp != null}
          <p class="data">혈압 &nbsp;<span class="tit">{healthList.mbpSbp}/{healthList.mbrDbp}</span>&nbsp;mmhg</p>
        {/if}
        {#if healthList.mbpPuls != null}
          <p class="data">맥박 &nbsp;<span class="tit">{healthList.mbpPuls}</span>&nbsp;bpm</p>
        {/if}
        {#if mbpDateString != null}
          <p class="data">{mbpDateString}</p>
        {/if}
      {/if}
      <div class="ar box1">
        <button
          type="button"
          class="mbtn_n_03"
          id="show"
          value="bp"
          on:click|stopPropagation={() => {
            popUpWhat = "bp";
            getCurrentDateTime();
            popUp = true;
          }}>기록</button
        >
      </div>
    </div>
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="my_info_item" on:click={() => goto(urlList.uaMbrBS)}>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
      <p class="hlthinfo">
        혈당&nbsp;&nbsp;
        {#if healthList.slvlStat != null}
          <span class="mbtn_b">{healthList.slvlStat}</span>
        {/if}
      </p>
    </label>
    <div class="box_1">
      {#if healthList.slvlMealBoa != null}
        <p class="data" style="padding: 10px 0px;">
          {healthList.slvlMealBoa} &nbsp;<span class="tit">{healthList.slvlData}</span>&nbsp;Mg/dl
        </p>
        <p class="data">{slvlDateString}</p>
      {:else}
        <p class="tit" style="padding: 10px 0px;">기록해주세요</p>
      {/if}
      <div class="ar box1">
        <button
          type="button"
          class="mbtn_n_03"
          id="show"
          value="bs"
          on:click|stopPropagation={() => {
            popUpWhat = "bs";
            getCurrentDateTime();
            popUp = true;
          }}>기록</button
        >
      </div>
    </div>
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="my_info_item" on:click={() => goto(urlList.uaMbrWgt)}>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
      <p class="hlthinfo">
        체중&nbsp;&nbsp;
        {#if healthList.wgtStat != null}
          <span class="mbtn_b">
            {healthList.wgtStat}
          </span>
        {/if}
      </p>
    </label>
    <div class="box_1">
      {#if healthList.wgtData != 0 && healthList.wgtData != null}
        <p class="data">
          체중 &nbsp;<span class="tit">{healthList.wgtData}</span>&nbsp;kg
        </p>
        <p class="data">BMI &nbsp;<span class="tit">{healthList.wgtBmi}</span>&nbsp;Kg/m²</p>
        <p class="data">{wgtDateString}</p>
      {:else}
        <p class="tit" style="padding: 10px 0px;">기록해주세요</p>
      {/if}
      <div class="ar box1">
        <button
          type="button"
          class="mbtn_n_03"
          id="show"
          value="kg"
          on:click|stopPropagation={() => {
            popUpWhat = "wgt";
            getCurrentDateTime();
            popUp = true;
          }}>기록</button
        >
      </div>
    </div>
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="my_info_item" on:click={() => goto(urlList.uaMbrTemp)}>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
      <p class="hlthinfo">
        체온&nbsp;/&nbsp;산소포화도&nbsp;&nbsp;
        <!-- {#if healthList.tmprStat != null}
              <span class="mbtn_b">{healthList.tmprStat}</span>
            {/if} -->
      </p>
    </label>
    <div class="box_1">
      {#if healthList.tmprData == 0 && healthList.tmprSatu == null}
        <p class="tit" style="padding: 10px 0px;">기록해주세요</p>
      {:else}
        {#if healthList.tmprData != null}
          <p class="data">체온 &nbsp;<span class="tit">{healthList.tmprData}</span>&nbsp;°C</p>
        {/if}
        {#if healthList.tmprSatu != null}
          <p class="data">산소포화도 &nbsp;<span class="tit">{healthList.tmprSatu}</span>&nbsp;%</p>
        {/if}
        {#if tmprDateString != null}
          <p class="data">{tmprDateString}</p>
        {/if}
      {/if}
      <div class="ar box1">
        <button
          type="button"
          class="mbtn_n_03"
          id="show"
          value="c"
          on:click|stopPropagation={() => {
            popUpWhat = "temp";
            getCurrentDateTime();
            popUp = true;
          }}>기록</button
        >
      </div>
    </div>
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="my_info_item" on:click={() => goto(urlList.uaMyBMI)}>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
      <p class="hlthinfo">
        체성분&nbsp;&nbsp;
        {#if healthList.ibdyStat != null}
          <span class="mbtn_b">{healthList.ibdyStat}</span>
        {/if}
      </p>
    </label>
    <div class="box_1">
      {#if healthList.ibdyBMI == 0 && healthList.ibdyFatr == 0}
        <p class="tit" style="padding: 10px 0px;">기록해주세요</p>
      {:else}
        {#if healthList.ibdyFatr != 0}
          <p class="data">체지방률 &nbsp;<span class="tit">{healthList.ibdyFatr}</span>&nbsp;%</p>
        {/if}
        {#if ibdyDateString != null}
          <p class="data">{ibdyDateString}</p>
        {/if}
      {/if}
      <div class="ar box1">
        <button
          type="button"
          class="mbtn_n_03"
          id="show"
          value="bmi"
          on:click|stopPropagation={() => {
            popUpWhat = "BMI";
            getCurrentDateTime();
            popUp = true;
          }}>기록</button
        >
      </div>
    </div>
  </div>
</div>

{#if popUpWhat == "bp"}
  <HealthPopUp {popUp}>
    <slot>
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <dl class="info_dl" slot="btns">
      <!-- 약 컬럼 생성 시 추가
      <dt>약복용</dt>
      <dd><input type="checkbox" checked /><span />&nbsp;</dd>-->
      <dt>날짜</dt>
      <dd><input type="date" bind:value={chkDay} id="wrtDate" on:click={getMaxDate} /></dd>
      <dt>시간</dt>
      <dd><input type="time" bind:value={chkTime} /></dd>
      <dt>수축기</dt>
      <dd><input type="text" style="width: 50%;" bind:value={mbpSbp} />&nbsp;mmhg</dd>
      <dt>이완기</dt>
      <dd><input type="text" style="width: 50%;" bind:value={mbrDbp} />&nbsp;mmhg</dd>
      <dt>맥박</dt>
      <dd><input type="text" style="width: 50%;" bind:value={mbpPuls} />&nbsp;bpm</dd>
    </dl>
    <div class="clsbtn" slot="btns_h">
      <div class="btn_wrap">
        <button type="button" class="mbtn_n_09" name="chbtn" id="close" on:click={xButton}>닫기</button>
        <button type="button" class="mbtn_n_03" name="chbtn" id="close" on:click={doWrtBp}>기록하기</button>
      </div>
    </div>
  </HealthPopUp>
{:else if popUpWhat == "bs"}
  <HealthPopUp {popUp}>
    <slot>
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <dl class="info_dl" slot="btns">
      <!--<dt>약복용</dt>
      <dd><input type="checkbox" checked /><span />&nbsp;</dd>-->
      <dt>날짜</dt>
      <dd><input type="date" bind:value={chkDay} id="wrtDate" on:click={getMaxDate} /></dd>
      <dt>시간</dt>
      <dd><input type="time" bind:value={chkTime} /></dd>
      <dt>식사여부</dt>
      <dd>
        <select name="" id="" style="font-size: 1rem;" bind:value={slvlMealBoa}>
          <option value="B">공복</option>
          <option value="A">식후</option>
        </select>
      </dd>
      <dt>혈당</dt>
      <dd><input type="text" style="width: 50%;" bind:value={slvlData} />&nbsp;Mg/dl</dd>
    </dl>
    <div class="clsbtn" slot="btns_h">
      <div class="btn_wrap">
        <button type="button" class="mbtn_n_09" name="chbtn" id="close" on:click={xButton}>닫기</button>
        <button type="button" class="mbtn_n_03" name="chbtn" id="close" on:click={doWrtBs}>기록하기</button>
      </div>
    </div>
  </HealthPopUp>
{:else if popUpWhat == "wgt"}
  <HealthPopUp {popUp}>
    <slot>
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <dl class="info_dl" slot="btns">
      <dt>날짜</dt>
      <dd><input type="date" bind:value={chkDay} id="wrtDate" on:click={getMaxDate} /></dd>
      <dt>시간</dt>
      <dd><input type="time" bind:value={chkTime} /></dd>
      <dt>체중</dt>
      <dd><input type="text" style="width: 50%;" bind:value={wgtData} />&nbsp;kg</dd>
      <dt>키</dt>
      <dd><input type="text" style="width: 50%;" bind:value={wgtHeight} />&nbsp;cm</dd>
    </dl>
    <div class="clsbtn" slot="btns_h">
      <div class="btn_wrap">
        <button type="button" class="mbtn_n_09" name="chbtn" id="close" on:click={xButton}>닫기</button>
        <button type="button" class="mbtn_n_03" name="chbtn" id="close" on:click={doWrtWgt}>기록하기</button>
      </div>
    </div>
  </HealthPopUp>
{:else if popUpWhat == "temp"}
  <HealthPopUp {popUp}>
    <slot>
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <dl class="info_dl" slot="btns">
      <dt>날짜</dt>
      <dd><input type="date" bind:value={chkDay} id="wrtDate" on:click={getMaxDate} /></dd>
      <dt>시간</dt>
      <dd><input type="time" bind:value={chkTime} /></dd>
      <dt>체온</dt>
      <dd><input type="text" style="width: 50%;" bind:value={tmprData} />&nbsp;°C</dd>
      <dt>산소포화도</dt>
      <dd><input type="text" style="width: 50%;" bind:value={tmprSatu} />&nbsp;%</dd>
    </dl>
    <div class="clsbtn" slot="btns_h">
      <div class="btn_wrap">
        <button type="button" class="mbtn_n_09" name="chbtn" id="close" on:click={xButton}>닫기</button>
        <button type="button" class="mbtn_n_03" name="chbtn" id="close" on:click={doWrtTemp}>기록하기</button>
      </div>
    </div>
  </HealthPopUp>
{:else if popUpWhat == "BMI"}
  <HealthPopUp {popUp}>
    <slot>
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <dl class="info_dl" slot="btns">
      <dt>날짜</dt>
      <dd><input type="date" bind:value={chkDay} id="wrtDate" on:click={getMaxDate} /></dd>
      <dt>시간</dt>
      <dd><input type="time" bind:value={chkTime} /></dd>
      <dt>체지방률</dt>
      <dd><input type="text" style="width: 50%;" bind:value={ibdyFatr} />&nbsp;%</dd>
    </dl>
    <div class="clsbtn" slot="btns_h">
      <div class="btn_wrap">
        <button type="button" class="mbtn_n_09" name="chbtn" id="close" on:click={xButton}>닫기</button>
        <button type="button" class="mbtn_n_03" name="chbtn" id="close" on:click={doWrtBMI}>기록하기</button>
      </div>
    </div>
  </HealthPopUp>
{/if}
{#if wrtPopUp == true}
  <PopUp {popUp}>
    <slot>
      기록에 실패하였습니다.<br />{rstStr} 다시한번 확인해주세요
      <button
        type="button"
        class="alert_close"
        on:click={() => {
          wrtPopUp = false;
        }}
      >
        <i class="xi-close-min" />
      </button>
    </slot>
    <div class="clsbtn" slot="btns">
      <div class="btn_wrap">
        <button
          type="button"
          class="mbtn_n_09"
          name="chbtn"
          id="close"
          on:click={() => {
            wrtPopUp = false;
          }}>닫기</button
        >
      </div>
    </div>
  </PopUp>
{/if}
