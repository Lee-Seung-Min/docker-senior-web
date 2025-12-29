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

  let popUp = false;
  let chart = true;
  let ibdyChkDttm;
  let ibdyDay;
  let ibdyTime;
  let ibdyFatr;
  let ibdyBmi;
  let strtDt = "";
  let endDt = "";
  let bmiList = [];
  let mbrId;
  let jwt;
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
          endDt = getCurrentDay();
          let monthAgo = getMonthAgo();
          strtDt = chngDateFormat(monthAgo);
          mbrId = result;
          const url = /*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/uaMyBMI?strtDt=" + strtDt;
          let resData = await getAPI(url);
          bmiList = resData.resultVO;
          console.log(bmiList);
          const script = document.createElement("script");
          script.async = true;
          script.src = "https://www.gstatic.com/charts/loader.js";
          document.head.appendChild(script);
          script.onload = () => {
            // Load the Visualization API and the corechart package.
            google.charts.load("current", { packages: ["line", "corechart"], language: "ko" });
            if (bmiList.length == 0) {
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
    let chartData = [["날짜", "체지방률"]];
    for (var i of bmiList.reverse()) {
      chartData.push([i.ibdyChkDt + " " + i.ibdyChkTm, i.ibdyFatr]);
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
    ibdyChkDttm = ibdyDay + " " + ibdyTime;
    if (ibdyFatr != undefined && ibdyFatr != "" && !isNaN(ibdyFatr)) {
      let jsonStr = makeStr({ ibdyChkDttm, ibdyMbrId: mbrId, ibdyFatr });
      let res = await postAPI(/*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/addMbrIbdy", jsonStr, jwt);
      console.log(res);
      if (res.resultVO == true) {
        popUp = false;
        endDt = getCurrentDay();
        let monthAgo = getMonthAgo();
        strtDt = chngDateFormat(monthAgo);
        ibdyFatr = "";
        search();
      }
    } else {
      rstStr = "체지방률";
      wrtPopUp = true;
    }
  }

  async function search() {
    const url = /*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/uaMyBMI?strtDt=" + strtDt + "&endDt=" + endDt;
    let resData = await getAPI(url);
    bmiList = resData.resultVO;
    console.log(bmiList);
    if (bmiList.length == 0) {
      chart = false;
    } else {
      chart = true;
    }
    google.charts.setOnLoadCallback(drawChart);
  }
  function xButton() {
    popUp = false;
  }
  // 현재 날짜와 시간을 가져오는 함수
  function getCurrentDateTime() {
    ibdyDay = getCurrentDay();
    ibdyTime = getCurrentTime();
  }
</script>

<Nav>체성분</Nav>

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
  {#if chart}
    <div class="chart">
      <div id="chart_div" style="width:100%; height:30vh" />
    </div>
    <div class="list_box" id="noti">
      <div class="box_1">
        {#each bmiList as bmi}
          <div class="hlthList">
            <div class="hlthDay">
              <p>{bmi.ibdyChkDt}</p>
              <p>{bmi.ibdyChkTm}</p>
            </div>
            <p class="tit">{bmi.ibdyFatr}<span class="hlthDay">&nbsp;%</span></p>
            <div class="status">{bmi.ibdyStat} &nbsp;</div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="list_box" id="noti">
      <div class="box_1">기록해주세요</div>
    </div>
  {/if}
</section>

<HealthPopUp {popUp}>
  <slot>
    <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
  </slot>
  <dl class="info_dl" slot="btns">
    <dt>날짜</dt>
    <dd><input type="date" id="wrtDate" bind:value={ibdyDay} on:click={getMaxDate} /></dd>
    <dt>시간</dt>
    <dd><input type="time" bind:value={ibdyTime} /></dd>
    <dt>체지방률</dt>
    <dd><input type="text" style="width: 50%;" bind:value={ibdyFatr} />&nbsp;%</dd>
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
      {rstStr} 다시한번 확인해주세요
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
