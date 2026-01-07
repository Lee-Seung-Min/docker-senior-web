<script>
  // @ts-nocheck

  import { onMount, tick } from "svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { getAPI } from "$lib/js/getAPI";
  import { adminUrlAddr } from "$lib/js/urlAddr";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import {
    chngDateFormat,
    getCurrentDay,
    get3MonthAgo,
    toYYMMDD
  } from "$lib/js/dateFunction";

  let strtDt = "";
  let endDt = "";
  let bpList = [];
  let hasChartData = true;

  let mbrId;
  let jwt;

  // -------------------------
  // Google Charts: 1회 로딩
  // -------------------------
  let chartsReadyPromise;

  function ensureGoogleChartsLoaded() {
    if (chartsReadyPromise) return chartsReadyPromise;

    chartsReadyPromise = new Promise((resolve, reject) => {
      const loadGoogle = () => {
        try {
          google.charts.load("current", { packages: ["corechart"], language: "ko" });
          google.charts.setOnLoadCallback(() => resolve());
        } catch (e) {
          reject(e);
        }
      };

      const existing = document.querySelector('script[data-google-charts="loader"]');
      if (existing) {
        if (window.google?.charts) loadGoogle();
        else existing.addEventListener("load", loadGoogle, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.dataset.googleCharts = "loader";
      script.async = true;
      script.src = "https://www.gstatic.com/charts/loader.js";
      script.onload = loadGoogle;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return chartsReadyPromise;
  }

  function makeBpListUrl() {
    const apiStrtDt = toYYMMDD(strtDt);
    const apiEndDt = toYYMMDD(endDt);
    return `${adminUrlAddr}/v1/myhealth/getBpList?strtDt=${apiStrtDt}&endDt=${apiEndDt}`;
  }

  async function reloadBpList() {
    const resData = await getAPI(makeBpListUrl());
    bpList = Array.isArray(resData) ? resData : resData?.resultVO ?? [];

    hasChartData = bpList.length !== 0;
    if (!hasChartData) return;

    await ensureGoogleChartsLoaded();
    await tick();
    drawChart();
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

      await reloadBpList();
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
  // Chart helpers + draw
  // -------------------------
  function mmddFromChkDt(mbpChkDt) {
    const [, m, d] = mbpChkDt.split("-");
    return `${m}/${d}`;
  }
  function dateSortKey(mbpChkDt) {
    const [yy, mm, dd] = mbpChkDt.split("-").map(Number);
    return yy * 10000 + mm * 100 + dd;
  }
  function timeSortKey(mbpChkTm) {
    const [hh, mi] = mbpChkTm.split(":").map(Number);
    return hh * 100 + mi;
  }

  function drawChart() {
    const byDate = new Map();

    for (const r of bpList) {
      const key = r.mbpChkDt;

      if (!byDate.has(key)) {
        byDate.set(key, {
          x: mmddFromChkDt(key),
          t: -1,
          sbp: null,
          dbp: null,
          tm: null,
          stat: null
        });
      }

      const row = byDate.get(key);
      const t = timeSortKey(r.mbpChkTm);

      if (t >= row.t) {
        row.t = t;
        row.sbp = r.mbpSbp != null ? Number(r.mbpSbp) : null;
        row.dbp = r.mbrDbp != null ? Number(r.mbrDbp) : null;
        row.tm = r.mbpChkTm;
        row.stat = r.mbpStat;
      }
    }

    const rows = [...byDate.entries()]
      .sort((a, b) => dateSortKey(a[0]) - dateSortKey(b[0]))
      .map(([rawDt, v]) => {
        const tipBase = `${v.x} ${v.tm}\n상태: ${v.stat}`;
        const sbpTip = v.sbp == null ? null : `${tipBase}\n수축기: ${v.sbp} mmHg`;
        const dbpTip = v.dbp == null ? null : `${tipBase}\n이완기: ${v.dbp} mmHg`;
        return [v.x, v.sbp, sbpTip, v.dbp, dbpTip];
      });

    const data = new google.visualization.DataTable();
    data.addColumn("string", "날짜");
    data.addColumn("number", "수축기");
    data.addColumn({ type: "string", role: "tooltip" });
    data.addColumn("number", "이완기");
    data.addColumn({ type: "string", role: "tooltip" });
    data.addRows(rows);

    const options = {
      legend: { position: "top" },
      curveType: "function",
      pointSize: 4,
      width: "100%",
      height: 320,
      interpolateNulls: true,
      vAxis: { title: "혈압 (mmHg)" },
      hAxis: { title: "날짜", slantedText: true, slantedTextAngle: 45 }
    };

    const bpChart = new google.visualization.LineChart(document.getElementById("chart_div"));
    bpChart.draw(data, options);
  }

  async function search() {
    await reloadBpList();
  }
</script>

<Nav>혈압</Nav>
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

  {#if hasChartData}
    <div class="chart">
      <div id="chart_div" style="width:100%; height:35vh" />
    </div>
    <div class="list_box" id="noti">
      <div class="box_1">
        {#each bpList as bp}
          <div class="hlthList">
            <div class="hlthDay" style="text-align:center; !important">
              <p>{bp.mbpChkDt}</p>
              <p>{bp.mbpChkTm}</p>
            </div>
            <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
              <p class="tit" style="margin:0;">
                수축기&nbsp;{bp.mbpSbp ?? "-"}&nbsp;<span class="hlthDay">mmHg</span>
              </p>
              <p class="tit" style="margin:0;">
                이완기&nbsp;{bp.mbrDbp ?? "-"}&nbsp;<span class="hlthDay">mmHg</span>
              </p>
            </div>
            <div class="status">
              <p>{bp.mbpStat}</p>
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
