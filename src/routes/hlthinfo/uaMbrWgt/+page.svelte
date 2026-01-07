<script>
  // @ts-nocheck
  import { onMount, tick } from "svelte";
  import HealthPopUp from "$lib/sub/nav/HealthPopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { getAPI } from "$lib/js/getAPI";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import { adminUrlAddr } from "$lib/js/urlAddr";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import {
    chngDateFormat,
    getCurrentDay,
    getCurrentTime,
    getMaxDate,
    getMonthAgo,
    get3MonthAgo,
    toYYMMDD
  } from "$lib/js/dateFunction";

  // -------------------------
  // state
  // -------------------------
  let popUp = false;
  let wgtChkDttm;
  let wgtDay;
  let wgtTime;
  let wgtData;
  let wgtHeight;

  let chart = true;
  let strtDt = "";
  let endDt = "";

  let wgtList = [];       // raw
  let dailyWgtList = [];  // ✅ 날짜별 1행(리스트/차트 공용)

  let mbrId;
  let jwt;

  let rstStr = "";
  let wrtPopUp = false;

  // -------------------------
  // utils
  // -------------------------
  function mmddFromChkDt(wgtChkDt = "") {
    // "26-01-06" -> "01/06"
    const parts = wgtChkDt.split("-");
    if (parts.length !== 3) return "";
    const [, m, d] = parts;
    return `${m}/${d}`;
  }

  function dateSortKey(wgtChkDt = "") {
    // "26-01-06" -> 260106
    const [yy, mm, dd] = wgtChkDt.split("-").map(Number);
    return (yy || 0) * 10000 + (mm || 0) * 100 + (dd || 0);
  }

  function timeSortKey(wgtChkTm = "") {
    // "16:02" -> 1602
    const [hh, mi] = wgtChkTm.split(":").map(Number);
    return (hh || 0) * 100 + (mi || 0);
  }

  function makeWgtUrl() {
    const apiStrtDt = toYYMMDD(strtDt);
    const apiEndDt = toYYMMDD(endDt);
    return `${adminUrlAddr}/v1/myhealth/getWgtList?strtDt=${apiStrtDt}&endDt=${apiEndDt}`;
  }

  // ✅ 날짜별 최신 1건만 남기기 (리스트/차트 통일)
  function buildDailyWgtList(list = []) {
    const byDate = new Map();

    for (const r of list) {
      const dt = r.wgtChkDt; // "26-01-06"
      if (!dt) continue;

      if (!byDate.has(dt)) {
        byDate.set(dt, {
          dt,
          x: mmddFromChkDt(dt),

          t: -1,
          tm: null,

          wgt: null,
          bmi: null,
          stat: null,
          height: null
        });
      }

      const row = byDate.get(dt);
      const t = timeSortKey(r.wgtChkTm);

      if (t >= row.t) {
        row.t = t;
        row.tm = r.wgtChkTm ?? null;

        row.wgt = r.wgtData != null && r.wgtData !== "" ? Number(r.wgtData) : null;
        row.bmi = r.wgtBmi != null && r.wgtBmi !== "" ? Number(r.wgtBmi) : null;

        row.stat = r.wgtStat ?? null;
        row.height = r.wgtHeight ?? null;
      }
    }

    // 최신 날짜가 위로 (기존 리스트 UX 유지)
    return [...byDate.values()].sort((a, b) => dateSortKey(b.dt) - dateSortKey(a.dt));
  }

  // -------------------------
  // Google Charts (1회 로딩)
  // -------------------------
  let chartsReadyPromise;

  function ensureChartsReady() {
    if (chartsReadyPromise) return chartsReadyPromise;

    chartsReadyPromise = new Promise((resolve, reject) => {
      const waitGoogle = () => {
        try {
          if (window.google?.charts) {
            google.charts.load("current", { packages: ["corechart"], language: "ko" });
            google.charts.setOnLoadCallback(() => resolve());
            return;
          }
          setTimeout(waitGoogle, 50);
        } catch (e) {
          reject(e);
        }
      };
      waitGoogle();
    });

    return chartsReadyPromise;
  }

  // ✅ 차트도 dailyWgtList 단일 소스 사용
  function drawChartFromDailyList(list) {
    // 차트는 날짜 오름차순이 보기 좋음
    const rows = [...(list ?? [])]
      .sort((a, b) => dateSortKey(a.dt) - dateSortKey(b.dt))
      .map((v) => {
        const base = `${v.x} ${v.tm ?? ""}\n상태: ${v.stat ?? "-"}${v.height ? `\n키: ${v.height} cm` : ""}`;
        const wgtTip = v.wgt == null ? null : `${base}\n체중: ${v.wgt} kg`;
        const bmiTip = v.bmi == null ? null : `${base}\nBMI: ${v.bmi}`;

        return [v.x, v.wgt, wgtTip, v.bmi, bmiTip];
      });

    const data = new google.visualization.DataTable();
    data.addColumn("string", "날짜");
    data.addColumn("number", "체중");
    data.addColumn({ type: "string", role: "tooltip" });
    data.addColumn("number", "BMI");
    data.addColumn({ type: "string", role: "tooltip" });
    data.addRows(rows);

    const options = {
      legend: { position: "top" },
      curveType: "function",
      pointSize: 4,
      width: "100%",
      height: 320,
      interpolateNulls: true,
      vAxes: {
        0: { title: "체중(kg)" },
        1: { title: "BMI(kg/㎡)" }
      },
      series: {
        0: { targetAxisIndex: 0 },
        1: { targetAxisIndex: 1 }
      }
    };

    const c = new google.visualization.LineChart(document.getElementById("chart_div"));
    c.draw(data, options);
  }

  // -------------------------
  // ✅ reload로 흐름 통일
  // -------------------------
  async function reload() {
    const url = makeWgtUrl();
    const res = await getAPI(url);

    wgtList = Array.isArray(res) ? res : res?.resultVO ?? [];
    dailyWgtList = buildDailyWgtList(wgtList);

    chart = dailyWgtList.length !== 0;

    // 기록이 있으면: 키 입력 기본값(기존 기능 유지)
    if (chart) {
      wgtHeight = dailyWgtList[0]?.height ?? wgtHeight;
    }

    if (!chart) return;

    await ensureChartsReady();
    await tick();
    drawChartFromDailyList(dailyWgtList);
  }

  // -------------------------
  // lifecycle
  // -------------------------
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");

    try {
      mbrId = await getUserId(jwt);
      if (!mbrId) return;

      endDt = getCurrentDay();
      strtDt = chngDateFormat(get3MonthAgo());

      await reload();
    } catch (err) {
      try {
        if (err.message == "21009") {
          await updateRefresh(refresh);
          location.reload();
        } else {
          console.error(err);
        }
      } catch (err) {
        console.error(err);
        localStorage.setItem("refreshJwt", "");
        localStorage.setItem("userJwt", "");
        alert("토큰 재발급 오류 발생. 다시 로그인해주세요");
        $isLogin = false;
        goto("/mbr/uaLogin");
      }
    }
  });

  // -------------------------
  // actions
  // -------------------------
  async function search() {
    await reload();
  }

  async function doWrt() {
    wgtChkDttm = wgtDay + " " + wgtTime;

    if (
      wgtData != undefined &&
      wgtData !== "" &&
      !isNaN(wgtData) &&
      wgtHeight != undefined &&
      wgtHeight !== "" &&
      !isNaN(wgtHeight)
    ) {
      const jsonStr = makeStr({ wgtChkDttm, wgtMbrId: mbrId, wgtData, wgtHeight });
      const res = await postAPI(adminUrlAddr + "/v1/myhealth/addMbrWgt", jsonStr, jwt);

      if (res.resultVO == true) {
        popUp = false;

        // 기존 동작 유지: 저장 후 1개월 조회
        endDt = getCurrentDay();
        strtDt = chngDateFormat(getMonthAgo());

        wgtData = "";

        await reload();
      }
    } else {
      rstStr = "";
      if (wgtData == undefined || wgtData === "" || isNaN(wgtData)) rstStr += "체중 ";
      if (wgtHeight == undefined || wgtHeight === "" || isNaN(wgtHeight)) rstStr += "키 ";
      wrtPopUp = true;
    }
  }

  function xButton() {
    popUp = false;
  }

  function getCurrentDateTime() {
    wgtDay = getCurrentDay();
    wgtTime = getCurrentTime();
  }
</script>

<svelte:head>
  <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
</svelte:head>

<Nav>체중 / BMI</Nav>

<section class="contents">
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
    <!-- ✅ 겹침 방지: 높이 확보 + overflow + 간격 -->
    <div
      class="chart"
      style="position:relative; height:clamp(260px, 35vh, 360px);"
    >
      <div id="chart_div" style="width:100%; height:100%; position:relative;"></div>
    </div>

    <div class="list_box" id="noti">
      <div class="box_1">
        {#each dailyWgtList as row (row.dt)}
          <div class="hlthList">
            <div class="hlthDay" style="text-align:center;">
              <p>{row.dt}</p>
              <p>{row.tm ?? "-"}</p>
            </div>

            <p class="tit">{row.wgt ?? "-"}&nbsp;<span class="hlthDay">kg</span></p>
            <p class="tit">{row.bmi ?? "-"}&nbsp;<span class="hlthDay">Kg/m²</span></p>
            <div class="status">{row.stat ?? ""}&nbsp;</div>
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
    <dd><input type="date" id="wrtDate" bind:value={wgtDay} on:click={getMaxDate} /></dd>

    <dt>시간</dt>
    <dd><input type="time" bind:value={wgtTime} /></dd>

    <dt>체중</dt>
    <dd><input type="text" style="width: 50%;" bind:value={wgtData} />&nbsp;kg</dd>

    <dt>키</dt>
    <dd><input type="text" style="width: 50%;" bind:value={wgtHeight} />&nbsp;cm</dd>
  </dl>

  <div class="clsbtn" slot="btns_h">
    <div class="btn_wrap">
      <button type="button" class="mbtn_n_09" on:click={xButton}>닫기</button>
      <button type="button" class="mbtn_n_03" on:click={doWrt}>기록하기</button>
    </div>
  </div>
</HealthPopUp>

{#if wrtPopUp == true}
  <PopUp {popUp}>
    <slot>
      기록에 실패하였습니다.<br />{rstStr} 다시한번 확인해주세요
      <button type="button" class="alert_close" on:click={() => (wrtPopUp = false)}>
        <i class="xi-close-min" />
      </button>
    </slot>

    <div class="clsbtn" slot="btns">
      <div class="btn_wrap">
        <button type="button" class="mbtn_n_09" on:click={() => (wrtPopUp = false)}>닫기</button>
      </div>
    </div>
  </PopUp>
{/if}
