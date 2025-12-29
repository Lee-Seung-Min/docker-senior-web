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
  import { chngDateFormat, getCurrentDay, getCurrentTime, getMaxDate, getMonthAgo } from "$lib/js/dateFunction";

  let tempList = [];
  let popUp = false;
  let tmprChkDttm;
  let tmprDay;
  let tmprTime;
  let tmprData;
  let tmprSatu;
  let strtDt = "";
  let endDt = "";
  let mbrId;
  let jwt;
  let rstStr;
  let wrtPopUp = false;
  let chart = true;
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          endDt = getCurrentDay();
          let monthAgo = getMonthAgo();
          strtDt = chngDateFormat(monthAgo);
          mbrId = result;
          const url = /*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/uaMbrTemp?strtDt=" + strtDt;
          let resData = await getAPI(url);
          tempList = resData.resultVO;
          console.log(tempList);
          const script = document.createElement("script");
          script.async = true;
          script.src = "https://www.gstatic.com/charts/loader.js";
          document.head.appendChild(script);
          script.onload = () => {
            // Load the Visualization API and the corechart package.
            google.charts.load("current", { packages: ["line", "corechart"], language: "ko" });
            if (tempList.length == 0) {
              chart = false;
            } else {
              google.charts.setOnLoadCallback(drawChart);
            }
          };
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
  // Callback that creates and populates a data table,
  // instantiates the pie chart, passes in the data and
  // draws it.
  function drawChart() {
    let chartData = [["날짜", "산소포화도"]];
    for (var i of tempList.reverse()) {
      chartData.push([i.tmprChkDttm, i.tmprSatu]);
    }
    console.log(chartData);
    var data = google.visualization.arrayToDataTable(chartData);

    var options = {
      curveType: "function",
      legend: { position: "bottom" },
      pointSize: 3,
      width: "100%",
    };
    var chart = new google.visualization.LineChart(document.getElementById("chart_div"));
    chart.draw(data, options);
  }

  async function doWrt() {
    tmprChkDttm = tmprDay + " " + tmprTime;
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
      console.log(res);
      if (res.resultVO == true) {
        popUp = false;
        endDt = getCurrentDay();
        let monthAgo = getMonthAgo();
        strtDt = chngDateFormat(monthAgo);
        tmprData = "";
        tmprSatu = "";
        search();
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

  async function search() {
    const url = /*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/uaMbrTemp?strtDt=" + strtDt + "&endDt=" + endDt;
    let resData = await getAPI(url);
    tempList = resData.resultVO;
    console.log(tempList);
  }
  function xButton() {
    popUp = false;
  }
  // 현재 날짜와 시간을 가져오는 함수
  function getCurrentDateTime() {
    tmprDay = getCurrentDay();
    tmprTime = getCurrentTime();
  }
</script>

<Nav>체온 / 산소포화도</Nav>
<section class="contents">
  <div class="setting">
    <div class="set">
      <button
        type="button"
        class="mbtn_n_03"
        id="show"
        on:click={() => {
          getCurrentDateTime();
          popUp = true;
        }}>기록</button
      >
    </div>
  </div>
  <div class="searchhl">
    <div class="hlcal">
      <input type="date" class="datepicker" id="strt_dy" bind:value={strtDt} />
      ~
      <input type="date" class="datepicker" id="end_dy" bind:value={endDt} />
    </div>
    <div class="hicalday">
      <button type="button" class="mbtn_n" on:click={search}>기간 설정</button>
    </div>
  </div>

  {#if tempList.length == 0}
    <div class="list_box" id="noti">
      <div class="box_1">기록해주세요</div>
    </div>
  {:else}
    <div class="chart">
      <div id="chart_div" style="width:100%; height:30vh" />
    </div>
    <div class="list_box" id="noti">
      <div class="box_1">
        {#each tempList as temp}
          <div class="hlthList">
            <div class="hlthDay">
              <p>{temp.tmprChkDt}</p>
              <p>{temp.tmprChkTm}</p>
            </div>
            <p class="tit">
              {temp.tmprData}&nbsp;<span class="hlthDay">°C &nbsp;/</span>&nbsp;&nbsp;{temp.tmprSatu}<span
                class="hlthDay">%</span
              >
            </p>
            <!-- <div class="status">{temp.tmprStat} &nbsp;</div> -->
            <div class="status">&nbsp;</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<HealthPopUp {popUp}>
  <slot>
    <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
  </slot>
  <dl class="info_dl" slot="btns">
    <dt>날짜</dt>
    <dd><input type="date" id="wrtDate" bind:value={tmprDay} on:click={getMaxDate} /></dd>
    <dt>시간</dt>
    <dd><input type="time" bind:value={tmprTime} /></dd>
    <dt>체온</dt>
    <dd><input type="text" style="width: 50%;" bind:value={tmprData} />&nbsp;°C</dd>
    <dt>산소포화도</dt>
    <dd><input type="text" style="width: 50%;" bind:value={tmprSatu} />&nbsp;%</dd>
  </dl>
  <div class="clsbtn" slot="btns_h">
    <div class="btn_wrap">
      <button type="button" class="mbtn_n_09" name="chbtn" id="close" on:click={xButton}>닫기</button>
      <button type="button" class="mbtn_n_03" name="chbtn" id="close" on:click={doWrt}>기록하기</button>
    </div>
  </div>
</HealthPopUp>
{#if wrtPopUp == true}
  <PopUp {popUp}>
    <slot>
      기록에 실패하였습니다.<br />
      {rstStr}다시한번 확인해주세요
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
