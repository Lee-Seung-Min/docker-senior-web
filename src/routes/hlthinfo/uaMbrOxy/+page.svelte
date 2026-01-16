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
  import { chngDateFormat, getCurrentDay, get3MonthAgo, toYYMMDD } from "$lib/js/dateFunction";

  let oxygenList = [];
  let dailyList = [];

  let strtDt = "";
  let endDt = "";

  let mbrId;
  let jwt;

  let chart = true;

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

  function makeOxyUrl() {
    const apiStrtDt = toYYMMDD(strtDt);
    const apiEndDt = toYYMMDD(endDt);
    return `${adminUrlAddr}/v1/myhealth/getOxygenList?strtDt=${apiStrtDt}&endDt=${apiEndDt}`;
  }

  // -------------------------
  // normalize
  // -------------------------
  function normalizeOxy(r) {
    // oxyChkDttm="25-12-31", oxyRegDttm="16:02:00" (가정)
    return {
      ...r,
      _key: r.oxyChkDttm || "",
      _tm: (r.oxyRegDttm || "").slice(0, 5)
    };
  }

  // 날짜별 "가장 늦은 시간" 산소 1개만 채택
  function buildDailyOxyList(oxyArr = []) {
    const byDate = new Map();

    const ensureRow = (key) => {
      if (!byDate.has(key)) {
        byDate.set(key, {
          key,
          x: mmddFromYYMMDD(key),

          oxygen: null,
          oxyT: -1,
          oxyTm: null,
          oxyStat: null
        });
      }
      return byDate.get(key);
    };

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
    // 날짜 오름차순(차트용)
    const rows = [...(list ?? [])]
      .sort((a, b) => dateSortKeyYYMMDD(a.key) - dateSortKeyYYMMDD(b.key))
      .map((v) => {
        const tip =
          v.oxygen == null
            ? null
            : `${v.x} ${v.oxyTm ?? ""}\n산소포화도: ${v.oxygen} %\n상태: ${v.oxyStat ?? "-"}`;
        return [v.x, v.oxygen, tip];
      });

    const data = new google.visualization.DataTable();
    data.addColumn("string", "날짜");
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
      vAxis: { title: "산소포화도(%)" }
    };

    const c = new google.visualization.LineChart(document.getElementById("chart_div"));
    c.draw(data, options);
  }

  async function reload() {
    const urlOxy = makeOxyUrl();
    const resOxy = await getAPI(urlOxy);
    const rawOxy = Array.isArray(resOxy) ? resOxy : resOxy?.resultVO ?? [];

    oxygenList = rawOxy.map(normalizeOxy);
    dailyList = buildDailyOxyList(oxygenList);

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
</script>

<svelte:head>
  <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
</svelte:head>

<Nav>산소포화도</Nav>

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

  {#if !chart}
    <div class="list_box" id="noti">
      <div class="box_1">기록해주세요</div>
    </div>
  {:else}
    <div class="chart" style="position:relative; height:clamp(260px, 35vh, 360px);">
      <div id="chart_div" style="width:100%; height:100%; position:relative;"></div>
    </div>

    <div class="list_box" id="noti">
      <div class="box_1">
        {#each dailyList as row (row.key)}
          <div class="hlthList">
            <div class="hlthDay">
              <p>{row.key}</p>
              <p>{#if row.oxyTm}산소 {row.oxyTm}{/if}</p>
            </div>

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
