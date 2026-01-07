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

  
  let tempList = [];
  let oxygenList = [];
  let dailyList = [];

  let popUp = false;
  let tmprChkDttm;
  let tmprDay;
  let tmprTime;
  let tmprData;

  let strtDt = "";
  let endDt = "";

  let mbrId;
  let jwt;

  let chart = true;

  let rstStr = "";
  let wrtPopUp = false;

  // -------------------------
  // utils
  // -------------------------
  function timeSortKey(hhmm = "") {
    const [hh, mi] = hhmm.split(":").map(Number);
    return (hh || 0) * 100 + (mi || 0);
  }

  function dateSortKeyYYMMDD(yyMMdd = "") {
    const [yy, mm, dd] = yyMMdd.split("-").map(Number);
    return (yy || 0) * 10000 + (mm || 0) * 100 + (dd || 0);
  }

  function mmddFromYYMMDD(yyMMdd = "") {
    const parts = yyMMdd.split("-");
    if (parts.length !== 3) return "";
    const [, m, d] = parts;
    return `${m}/${d}`;
  }

  function makeTempUrl() {
    const apiStrtDt = toYYMMDD(strtDt);
    const apiEndDt = toYYMMDD(endDt);
    return `${adminUrlAddr}/v1/myhealth/getTemperatureList?strtDt=${apiStrtDt}&endDt=${apiEndDt}`;
  }

  function makeOxyUrl() {
    const apiStrtDt = toYYMMDD(strtDt);
    const apiEndDt = toYYMMDD(endDt);
    return `${adminUrlAddr}/v1/myhealth/getOxygenList?strtDt=${apiStrtDt}&endDt=${apiEndDt}`;
  }

  // -------------------------
  // normalize
  // -------------------------
  function normalizeTemp(r) {
    // "2025-12-31 16:02:20.316" -> key:"25-12-31", tm:"16:02"
    const dttm = r.tmprChkDttm ?? "";
    const [datePart = "", timePart = ""] = dttm.split(" ");

    const [yyyy = "", mm = "", dd = ""] = datePart.split("-");
    const yy = yyyy ? yyyy.slice(2) : "";
    const key = yy && mm && dd ? `${yy}-${mm}-${dd}` : "";

    const hhmm = timePart ? timePart.slice(0, 5) : "";

    return {
      ...r,
      _key: key,
      _tm: hhmm,

      // 화면용(혹시 null이면)
      tmprChkDt: key,
      tmprChkTm: hhmm
    };
  }

  function normalizeOxy(r) {
    // oxyChkDttm="25-12-31", oxyRegDttm="16:02"
    return {
      ...r,
      _key: r.oxyChkDttm || "",
      _tm: (r.oxyRegDttm || "").slice(0, 5)
    };
  }

  
  // 날짜별로 체온/산소 각각 "가장 늦은 시간" 1개만 채택

  function buildDailyList(tempArr = [], oxyArr = []) {
    const byDate = new Map();

    const ensureRow = (key) => {
      if (!byDate.has(key)) {
        byDate.set(key, {
          key, // "25-12-31"
          x: mmddFromYYMMDD(key),

          temp: null,
          tempT: -1,
          tempTm: null,
          tempStat: null,

          oxygen: null,
          oxyT: -1,
          oxyTm: null,
          oxyStat: null
        });
      }
      return byDate.get(key);
    };

    // 체온
    for (const r of tempArr) {
      if (!r?._key) continue;
      const row = ensureRow(r._key);
      const t = timeSortKey(r._tm);
      if (t >= row.tempT) {
        row.tempT = t;
        row.temp = r.tmprData != null && r.tmprData !== "" ? Number(r.tmprData) : null;
        row.tempTm = r._tm || null;
        // tempStat가 있다면 반영 (없으면 null)
        row.tempStat = r.tmprStat ?? r.tempStat ?? null;
      }
    }

    // 산소
    for (const r of oxyArr) {
      if (!r?._key) continue;
      const row = ensureRow(r._key);
      const t = timeSortKey(r._tm);
      if (t >= row.oxyT) {
        row.oxyT = t;
        row.oxygen = r.oxyData != null && r.oxyData !== "" ? Number(r.oxyData) : null;
        row.oxyTm = r._tm || null;
        row.oxyStat = r.oxyStat ?? null;
      }
    }

    // 최신 날짜가 위
    return [...byDate.values()].sort((a, b) => dateSortKeyYYMMDD(b.key) - dateSortKeyYYMMDD(a.key));
  }

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

  
  function drawChartFromDailyList(list) {
    // 날짜 오름차순
    const rows = [...(list ?? [])]
      .sort((a, b) => dateSortKeyYYMMDD(a.key) - dateSortKeyYYMMDD(b.key))
      .map((v) => {
        const tempTip =
          v.temp == null ? null : `${v.x} ${v.tempTm ?? ""}\n체온: ${v.temp} °C`;

        const oxyTip =
          v.oxygen == null
            ? null
            : `${v.x} ${v.oxyTm ?? ""}\n산소포화도: ${v.oxygen} %\n상태: ${v.oxyStat ?? "-"}`;

        return [v.x, v.temp, tempTip, v.oxygen, oxyTip];
      });

    const data = new google.visualization.DataTable();
    data.addColumn("string", "날짜");
    data.addColumn("number", "체온(°C)");
    data.addColumn({ type: "string", role: "tooltip" });
    data.addColumn("number", "산소포화도(%)");
    data.addColumn({ type: "string", role: "tooltip" });
    data.addRows(rows);

    const options = {
      legend: { position: "top" },
      curveType: "function",
      pointSize: 4,
      width: "100%",
      height: 320,
      interpolateNulls: true,
      hAxis: { title: "날짜", slantedText: true, slantedTextAngle: 45 },
      vAxes: {
        0: { title: "체온(°C)" },
        1: { title: "산소포화도(%)" }
      },
      series: {
        0: { targetAxisIndex: 0 },
        1: { targetAxisIndex: 1 }
      }
    };

    const c = new google.visualization.LineChart(document.getElementById("chart_div"));
    c.draw(data, options);
  }

  // reload 통일
  async function reload() {
    const urlTemp = makeTempUrl();
    const urlOxy = makeOxyUrl();

    const [resTemp, resOxy] = await Promise.all([getAPI(urlTemp), getAPI(urlOxy)]);

    const rawTemp = Array.isArray(resTemp) ? resTemp : resTemp?.resultVO ?? [];
    const rawOxy = Array.isArray(resOxy) ? resOxy : resOxy?.resultVO ?? [];

    tempList = rawTemp.map(normalizeTemp);
    oxygenList = rawOxy.map(normalizeOxy);

    dailyList = buildDailyList(tempList, oxygenList);
    chart = dailyList.length !== 0;

    if (!chart) return;

    await ensureChartsReady();
    await tick();
    drawChartFromDailyList(dailyList);
  }

  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");

    try {
      mbrId = await getUserId(jwt);
      if (!mbrId) return;

      endDt = getCurrentDay(); // YYYY-MM-DD
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
    tmprChkDttm = tmprDay + " " + tmprTime;
    if (tmprData != undefined && tmprData !== "" && !isNaN(tmprData)) {
      const jsonStr = makeStr({
        tmprChkDttm,
        tmprMbrId: mbrId,
        tmprData
      });

      const res = await postAPI(adminUrlAddr + "/v1/myhealth/addMbrTmpr", jsonStr, jwt);

      if (res.resultVO == true) {
        popUp = false;

        endDt = getCurrentDay();
        strtDt = chngDateFormat(get3MonthAgo());

        tmprData = "";

        await reload();
      }
    } else {
      rstStr = "체온 ";
      wrtPopUp = true;
    }
  }

  function xButton() {
    popUp = false;
  }

  function getCurrentDateTime() {
    tmprDay = getCurrentDay();
    tmprTime = getCurrentTime();
  }
</script>

<svelte:head>
  <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
</svelte:head>

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
        }}
      >
        체온기록
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

  {#if !chart}
    <div class="list_box" id="noti">
      <div class="box_1">기록해주세요</div>
    </div>
  {:else}
    <div
      class="chart"
      style="position:relative; height:clamp(260px, 35vh, 360px);"
    >
      <div id="chart_div" style="width:100%; height:100%; position:relative;"></div>
    </div>

    <div class="list_box" id="noti">
      <div class="box_1">
        {#each dailyList as row (row.key)}
          <div class="hlthList">
            <div class="hlthDay">
              <p>{row.key}</p>
              <p>
                {#if row.tempTm}체온 {row.tempTm}{/if}
                {#if row.oxyTm}
                  {#if row.tempTm} / {/if}
                  산소 {row.oxyTm}
                {/if}
              </p>
            </div>

            <p class="tit">
              체온&nbsp;
              <span class="tit">{row.temp ?? "-"}</span>&nbsp;<span class="hlthDay">°C</span>
            </p>

            <p class="tit">
              산소포화도&nbsp;
              <span class="tit">{row.oxygen ?? "-"}</span>&nbsp;<span class="hlthDay">%</span>
            </p>
            <div class="status">
              {#if row.oxyStat}{row.oxyStat}{:else}&nbsp;{/if}
            </div>
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
