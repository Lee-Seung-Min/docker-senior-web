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
  let mbpChkDttm;
  let mbpDay;
  let mbpTime;
  let mbpSbp;
  let mbrDbp;
  let strtDt = "";
  let endDt = "";
  let bpList = [];
  let chart = true;
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
          const url = /*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/uaMbrBP?strtDt=" + strtDt;
          let resData = await getAPI(url);
          bpList = resData.resultVO;
          console.log(bpList);
          const script = document.createElement("script");
          script.async = true;
          script.src = "https://www.gstatic.com/charts/loader.js";
          document.head.appendChild(script);
          script.onload = () => {
            // Load the Visualization API and the corechart package.
            google.charts.load("current", { packages: ["corechart"], language: "ko" });

            if (bpList.length == 0) {
              chart = false;
            } else {
              // Set a callback to run when the Google Visualization API is loaded.
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
  //구글차트 그리기
  function drawChart() {
    let chartData = [["날짜", "수축기", "이완기"]];
    for (var i of bpList.reverse()) {
      chartData.push([i.mbpChkDttm, i.mbpSbp, i.mbrDbp]);
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

  //BP 추가
  async function doWrt() {
    mbpChkDttm = mbpDay + " " + mbpTime;
    if (
      mbpSbp != undefined &&
      mbpSbp != "" &&
      !isNaN(mbpSbp) &&
      mbrDbp != undefined &&
      mbrDbp != "" &&
      !isNaN(mbrDbp)
    ) {
      let jsonStr = makeStr({ mbpChkDttm, mbpMbrId: mbrId, mbpSbp, mbrDbp });
      let res = await postAPI(/*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/addMbrBP", jsonStr, jwt);
      console.log(res);
      if (res.resultVO == true) {
        popUp = false;
        endDt = getCurrentDay();
        let monthAgo = getMonthAgo();
        strtDt = chngDateFormat(monthAgo);
        mbpSbp = "";
        mbrDbp = "";
        search();
      }
    } else {
      rstStr = "";
      if (mbpSbp == undefined || mbpSbp == "" || isNaN(mbpSbp)) {
        rstStr += "수축기 ";
      }
      if (mbrDbp == undefined || mbrDbp == "" || isNaN(mbrDbp)) {
        rstStr += "이완기 ";
      }
      wrtPopUp = true;
    }
  }

  //기간 검색
  async function search() {
    const url = /*urlAddr + "8081*/ adminUrlAddr + "/v1/myhealth/uaMbrBP?strtDt=" + strtDt + "&endDt=" + endDt;
    let resData = await getAPI(url);
    bpList = resData.resultVO;
    console.log(bpList);
    if (bpList.length == 0) {
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
    mbpDay = getCurrentDay();
    mbpTime = getCurrentTime();
  }
</script>

<Nav>혈압</Nav>
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
        {#each bpList as bp}
          <div class="hlthList">
            <div class="hlthDay">
              <p>{bp.mbpChkDt}</p>
              <p>{bp.mbpChkTm}</p>
            </div>
            <p class="tit">{bp.mbpSbp + "/" + bp.mbrDbp}&nbsp;<span class="hlthDay">mmhg</span></p>
            <div class="status">
              <p>{bp.mbpStat}</p>
              &nbsp;
              <!-- 추후 약 선택 가능하게 된 이후에 추가
              <p class="pill" /> <div class="noPill" />-->
            </div>
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
    <!-- 약 컬럼 생성 시 추가
  <dt>약복용</dt>
  <dd><input type="checkbox" checked /><span />&nbsp;</dd>-->
    <dt>날짜</dt>
    <dd><input type="date" id="wrtDate" bind:value={mbpDay} on:click={getMaxDate} /></dd>
    <dt>시간</dt>
    <dd><input type="time" bind:value={mbpTime} /></dd>
    <dt>수축기</dt>
    <dd><input type="text" style="width: 50%;" bind:value={mbpSbp} />&nbsp;mmhg</dd>
    <dt>이완기</dt>
    <dd><input type="text" style="width: 50%;" bind:value={mbrDbp} />&nbsp;mmhg</dd>
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
