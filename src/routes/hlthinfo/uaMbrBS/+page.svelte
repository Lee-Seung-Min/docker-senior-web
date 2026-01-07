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
    get3MonthAgo,
    toYYMMDD
  } from "$lib/js/dateFunction";

  let popUp = false;
  let slvlChkDttm;
  let slvlDay;
  let slvlTime;
  let slvlData;
  let slvlMealBoa;

  let chart = true;
  let strtDt = "";
  let endDt = "";
  let bsList = [];
  let dailyBsList = [];

  let mbrId;
  let jwt;
  let rstStr;
  let wrtPopUp = false;

  function mmddFromChkDt(slvlChkDt) {
    const [, m, d] = slvlChkDt.split("-");
    return `${m}/${d}`;
  }

  function dateSortKey(slvlChkDt) {
    const [yy, mm, dd] = slvlChkDt.split("-").map(Number);
    return yy * 10000 + mm * 100 + dd;
  }

  function timeSortKey(slvlChkTm) {
    const [hh, mi] = slvlChkTm.split(":").map(Number);
    return hh * 100 + mi;
  }

  function makeBsListUrl() {
    const apiStrtDt = toYYMMDD(strtDt);
    const apiEndDt = toYYMMDD(endDt);
    return `${adminUrlAddr}/v1/myhealth/getBsList?strtDt=${apiStrtDt}&endDt=${apiEndDt}`;
  }

  function buildDailyBsList(list = []) {
    const byDate = new Map();

    for (const r of list) {
      const dt = r.slvlChkDt;
      const tm = r.slvlChkTm || "";
      const tKey = tm ? timeSortKey(tm) : -1;

      const isBefore = r.slvlMealBoa === "식전" || r.slvlMealBoa === "B";
      const isAfter = r.slvlMealBoa === "식후" || r.slvlMealBoa === "A";

      if (!byDate.has(dt)) {
        byDate.set(dt, {
          dt,
          before: null,
          beforeTm: null,
          beforeStat: null,
          beforeT: -1,
          after: null,
          afterTm: null,
          afterStat: null,
          afterT: -1
        });
      }

      const row = byDate.get(dt);
      const val = r.slvlData != null && r.slvlData !== "" ? Number(r.slvlData) : null;

      if (isBefore && tKey >= row.beforeT) {
        row.beforeT = tKey;
        row.before = val;
        row.beforeTm = tm || null;
        row.beforeStat = r.slvlStat ?? null;
      }

      if (isAfter && tKey >= row.afterT) {
        row.afterT = tKey;
        row.after = val;
        row.afterTm = tm || null;
        row.afterStat = r.slvlStat ?? null;
      }
    }

    // 최신 날짜가 위로
    return [...byDate.values()].sort((a, b) => dateSortKey(b.dt) - dateSortKey(a.dt));
  }

  let chartsReadyPromise;

  function ensureChartsReady() {
    if (chartsReadyPromise) return chartsReadyPromise;

    chartsReadyPromise = new Promise((resolve, reject) => {
      const waitGoogle = () => {
        try {
          if (window.google?.charts) {
            google.charts.load("current", { packages: ["line", "corechart"], language: "ko" });
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

  // 차트 그리는 공통소스
  function drawChartFromDailyList(list) {
    // 차트를 위한 날짜 오름차순 재정렬
    const rows = [...(list ?? [])]
      .sort((a, b) => dateSortKey(a.dt) - dateSortKey(b.dt))
      .map((v) => {
        const x = mmddFromChkDt(v.dt);

        const beforeTip =
          v.before == null
            ? null
            : `${x} ${v.beforeTm ?? ""}\n식전: ${v.before} mg/dL\n상태: ${v.beforeStat ?? ""}`;

        const afterTip =
          v.after == null
            ? null
            : `${x} ${v.afterTm ?? ""}\n식후: ${v.after} mg/dL\n상태: ${v.afterStat ?? ""}`;

        return [x, v.before, beforeTip, v.after, afterTip];
      });

    const data = new google.visualization.DataTable();
    data.addColumn("string", "날짜");
    data.addColumn("number", "식전");
    data.addColumn({ type: "string", role: "tooltip" });
    data.addColumn("number", "식후");
    data.addColumn({ type: "string", role: "tooltip" });
    data.addRows(rows);

    const options = {
      legend: { position: "top" },
      curveType: "function",
      pointSize: 4,
      width: "100%",
      height: 320,
      interpolateNulls: true,
      vAxis: { title: "혈당 (mg/dL)" },
      hAxis: { title: "날짜", slantedText: true, slantedTextAngle: 45 }
    };

    const c = new google.visualization.LineChart(document.getElementById("chart_div"));
    c.draw(data, options);
  }

  async function reload() {
    const url = makeBsListUrl();
    const res = await getAPI(url);

    bsList = Array.isArray(res) ? res : res?.resultVO ?? [];

    dailyBsList = buildDailyBsList(bsList);
    chart = bsList.length !== 0;

    if (!chart) return;

    await ensureChartsReady();
    await tick();
    drawChartFromDailyList(dailyBsList);
  }

  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");

    try {
      const result = await getUserId(jwt);
      if (!result) return;

      mbrId = result;

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

  async function search() {
    await reload();
  }

  async function doWrt() {
    slvlChkDttm = slvlDay + " " + slvlTime;

    if (slvlData != undefined && slvlData != "" && !isNaN(slvlData)) {
      const jsonStr = makeStr({ slvlChkDttm, slvlMbrId: mbrId, slvlMealBoa, slvlData });
      const res = await postAPI(adminUrlAddr + "/v1/myhealth/addMbrBs", jsonStr, jwt);

      if (res.resultVO == true) {
        popUp = false;

        // 저장 후 3개월 조회 유지
        endDt = getCurrentDay();
        strtDt = chngDateFormat(get3MonthAgo());

        slvlMealBoa = "";
        slvlData = "";

        await reload();
      }
    } else {
      rstStr = "혈당 ";
      wrtPopUp = true;
    }
  }

  function xButton() {
    popUp = false;
  }

  function getCurrentDateTime() {
    slvlDay = getCurrentDay();
    slvlTime = getCurrentTime();
  }
</script>

<svelte:head>
  <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
</svelte:head>

<Nav>혈당</Nav>

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
        }}
      >
        기록
      </button>
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
    <!-- 차트 영역(겹침 방지: height 확보 + overflow 차단 + 간격) -->
    <div
      class="chart"
      style="position:relative; height:clamp(260px, 35vh, 360px);"
    >
      <div id="chart_div" style="width:100%; height:100%; position:relative;"></div>
    </div>

    <div class="list_box" id="noti" style="position:relative;">
      <div class="box_1">
        {#each dailyBsList as row (row.dt)}
          <div class="hlthList">
            <div class="hlthDay" style="text-align:center;">
              <p style="margin:0;">{row.dt}</p>
              <p style="margin:0;">식전 {row.beforeTm ?? "-"} / 식후 {row.afterTm ?? "-"}</p>
            </div>

            <div class="tit" style="min-width:0; text-align:center;">
              <p style="margin:0;">
                식전 : {row.before ?? "-"} <span class="hlthDay">&nbsp;mg/dL</span>
              </p>
              <p style="margin:0;">
                식후 : {row.after ?? "-"} <span class="hlthDay">&nbsp;mg/dL</span>
              </p>
            </div>

            <div class="status" style="flex-direction:column;">
              <p style="margin:0;">식전: {row.beforeStat ?? "-"}</p>
              <p style="margin:0;">식후: {row.afterStat ?? "-"}</p>
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
    <dt>날짜</dt>
    <dd><input type="date" id="wrtDate" bind:value={slvlDay} on:click={getMaxDate} /></dd>

    <dt>시간</dt>
    <dd><input type="time" bind:value={slvlTime} /></dd>

    <dt>식사여부</dt>
    <dd>
      <select style="font-size: 1rem;" bind:value={slvlMealBoa}>
        <option value="B">식전</option>
        <option value="A">식후</option>
      </select>
    </dd>

    <dt>혈당</dt>
    <dd><input type="text" style="width: 50%;" bind:value={slvlData} />&nbsp;Mg/dl</dd>
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
      기록에 실패하였습니다.<br />
      {rstStr}다시한번 확인해주세요
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
