<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import { dgnsShpId, dgnsDtrId, dgnsRsvDttm, dgnsType, childMount } from "$lib/store/rgstStore.js";
  import { getAPI } from "$lib/js/getAPI";
  import { page } from "$app/stores";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { getDataAPI } from "$lib/js/getDataAPI";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import { getIosDay } from "$lib/js/dateFunction";
  import datablock from "zxing/lib/datablock";
  let popUpWhat = "";
  let setMonth;
  let popUp = false;
  let today;
  let firstDate;
  let lastDate;
  let calYear;
  let calMonth;
  let getDay;
  let lastDay;
  let checkDay;
  let week;
  let checkClass;
  let nowMonth;
  let nowYear;
  let nowDay;
  let rgDay;
  let rgYear;
  let rgMonth;
  let fhour;
  let shpId;
  let hlday = [];
  let hashMap = {};
  let isFirstSearch = true;
  export let rghour = [{ htmeFrom: "", htmeTo: "" }];
  export let hour;
  export let day;
  export let dtrNo;
  onMount(async () => {
  // childMount 스토어와 isFirstSearch 플래그를 완전히 제거합니다.
  // onMount는 컴포넌트가 생성될 때마다 실행되므로, 이 로직은 항상 최신 상태를 보장합니다.

  shpId = $page.url.searchParams.get("shpId");
  checkClass = 0;
  setMonth = new Date();
  today = setMonth.getDate();
  nowDay = new Date(setMonth.getFullYear(), setMonth.getMonth(), today);
  nowYear = setMonth.getFullYear();
  nowMonth = setMonth.getMonth() + 1;

  buildCalendar();

  // 예약 수정 로직은 그대로 유지합니다.
  if ($dgnsRsvDttm != null && $dgnsRsvDttm != "") {
    shpId = $dgnsShpId;
    let date = new Date($dgnsRsvDttm);
    const timeUrl =
      shopUrlAddr +
      "/v1/Shop/uaDgnsDtrTm?dtmeDtrId=" +
      $dgnsDtrId +
      "&htmeHsptId=" +
      $dgnsShpId +
      "&htmeDay=" +
      date.getDay() +
      "&dtmeType=" +
      $dgnsType;
    let resData = await getAPI(timeUrl); //의사&날짜 별 예약 가능 시간 찾기
    if (resData.resultVO.length != 0) {
      // (기존 예약 수정 로직은 변경 없이 그대로 둡니다)
      rghour = resData.resultVO;
      setMonth = new Date(date.getFullYear(), date.getMonth(), date.getDay(), date.getHours(), date.getMinutes());
      buildCalendar();
      fhour = setMonth.getHours() + ":" + setMonth.getMinutes();
      if (setMonth.getHours() < 10) {
        fhour = "0" + fhour;
      }
      if (setMonth.getMinutes() == 0) {
        fhour += "0";
      }
      hour = rghour.find(findTime).htmeFrom;
      rgDay = date.getDate();
      rgYear = date.getFullYear();
      rgMonth = date.getMonth() + 1;
      checkClass = rgDay;
      day = rgYear + "." + rgMonth + "." + rgDay;
      // let dow = new Date(day);
      // todayTm(dow);

      
    } else {
      hour = "";
      rghour = [{ htmeFrom: "", htmeTo: "" }];
    }
  } else {
    //처음 예약 할 때
    hour = "";
    rghour = [{ htmeFrom: "", htmeTo: "" }];
  }
});
  //캘린더 만들기
  async function buildCalendar() {
    firstDate = new Date(setMonth.getFullYear(), setMonth.getMonth(), 1);
    lastDate = new Date(setMonth.getFullYear(), setMonth.getMonth() + 1, 0);
    calYear = setMonth.getFullYear();
    calMonth = setMonth.getMonth() + 1;
    const hUrl = mobileUrlAddr + "/v1/dgns/selectHday?year=" + calYear + "&month=" + calMonth;
    let hData = await getAPI(hUrl);
    if (hData.resultVO == null) {
      hlday = [];
    } else {
      hlday = hData.resultVO.hdayList;
    }

    // hashMap = {};
    // if (hlday == undefined || hlday.length === 0) {
    //   console.log("hlday is empty or not an array.");
    // } else {
    //   if (!Array.isArray(hlday)) {
    //     hlday = [hlday]; // hlday가 1개의 요소를 가진 경우 배열로 변환
    //   }

    //   for (let hl of hlday) {
    //     let i = hl.locdate.toString();
    //     console.log(i);
    //     let hday = i.substring(i.length - 2);
    //     let hint = parseInt(hday);
    //     hashMap[hint] = hl.dateName;
    //   }
    // }
    // console.log(hashMap);
    getDay = firstDate.getDay();
    lastDay = lastDate.getDate();
    let getWeek = lastDay + getDay + 1;
    if (getWeek % 7 == 0) {
      week = Math.floor(getWeek / 7);
    } else {
      week = Math.floor(getWeek / 7) + 1;
    }
    checkDay = 7 - getDay;
  }

  // 이전달 버튼 클릭
  function prevCalendar() {
    setMonth = new Date(setMonth.getFullYear(), setMonth.getMonth() - 1, 1); // 현재 달을 1 감소
    buildCalendar(); // 달력 다시 생성
    checkClass = 0;
  }
  // 다음달 버튼 클릭
  function nextCalendar() {
    setMonth = new Date(setMonth.getFullYear(), setMonth.getMonth() + 1, 1); // 현재 달을 1 증가
    buildCalendar(); // 달력 다시 생성
    checkClass = 0;
  }
  //캘린더 날짜 선택
  async function selectDay(sday) {
    checkClass = sday;
    day = getIosDay(calYear, calMonth, sday);
    console.log("selectDay : ",day);
    let dow = new Date(day);

    //공휴일 선택 불가 처리
    if (isHoliday(dow)) {
      console.log("공휴일입니다.");
      hour = "holiday";
      rghour = [{ htmeFrom: "", htmeTo: "" }];
      return;
    }
    
    const timeUrl =
      /*urlAddr +
      "8080*/ shopUrlAddr +
      "/v1/Shop/uaDgnsDtrTm?dtmeDtrId=" +
      dtrNo +
      "&htmeHsptId=" +
      shpId +
      "&htmeDay=" +
      dow.getDay() +
      "&dtmeType=" +
      $dgnsType +
      "&dtmeDay=" +
      day;
    let resData = await getAPI(timeUrl); //의사&날짜 별 예약 가능 시간 찾기
    console.log("uaDgnsDtrTm resData : ",resData);
    if (resData.resultVO.length != 0 && resData.message == "OK.") {
      if (resData.resultVO[0].htmeType == "vacation") {
        hour = "vacation";
        rghour = [{ htmeFrom: "", htmeTo: "" }];
      } else {
        rghour = resData.resultVO;
        hour = rghour[0].htmeFrom;
        //todayTm(dow, hour);
      }
    } else {
      hour = "";
      rghour = [{ htmeFrom: "holiday", htmeTo: "" }];
    }
  }
  //수정 or 변경시 기존에 저장한 시간 찾기
  function findTime(e) {
    if (e.htmeFrom == fhour) {
      return true;
    }
  }

  //오늘 선택시 과거 시간 선택 불가하게
  function todayTm(dow, chkHour) {
    if (areDatesEqual(dow, new Date())) {
      let now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      rghour = rghour.filter((obj) => {
        const hour = parseInt(obj.htmeFrom.split(":")[0]);
        const minute = parseInt(obj.htmeFrom.split(":")[1]);
        return hour > currentHour || (hour === currentHour && minute > currentMinute);
      });
      if (rghour.length == 0) {
        hour = "";
      } else if (chkHour < rghour[0].htmeFrom) {
        hour = rghour[0].htmeFrom;
      }
    }
  }
  function areDatesEqual(date1, date2) {
    // 년, 월, 일을 비교하여 오늘인지 아닌지
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
    popUpWhat = "";
  }

  function isHoliday(sday){
    const dayNum = sday.getDate();
    return hlday.includes(dayNum);
  }
</script>

<div class="box_1">
  <div class="calendar">
    <div class="bg_gray">
      <button type="button" title="이전달" class="prev" on:click={prevCalendar} />
      <span>{calYear + "년 " + calMonth + "월"}</span>
      <button type="button" title="다음달" class="next" on:click={nextCalendar} />
    </div>
    <div class="cal">
      <table>
        <thead>
          <tr>
            <th>일</th>
            <th>월</th>
            <th>화</th>
            <th>수</th>
            <th>목</th>
            <th>금</th>
            <th>토</th>
          </tr>
        </thead>
        <tbody>
          {#each Array(week) as w, i}
            <tr>
              {#if i == 0}
                {#each Array(getDay) as j}
                  <td />
                {/each}
                {#each Array(checkDay) as d, j}
                  {#if lastDate < nowDay}
                    {#if hlday.includes(j + 1)}
                      <td class="txt_red">{j + 1}</td>
                    {:else if getDay + j == 6}
                      <td class="txt_blue">{j + 1}</td>
                    {:else if getDay + j == 0}
                      <td class="txt_red">{j + 1}</td>
                    {:else}
                      <td>{j + 1}</td>
                    {/if}
                  {:else if nowYear == calYear && nowMonth == calMonth && j + 1 < today}
                    {#if hlday.includes(j + 1)}
                      <td class="txt_red">{j + 1}</td>
                    {:else if getDay + j == 6}
                      <td class="txt_blue">{j + 1}</td>
                    {:else if getDay + j == 0}
                      <td class="txt_red">{j + 1}</td>
                    {:else}
                      <td>{j + 1}</td>
                    {/if}
                  {:else if nowYear == calYear && nowMonth == calMonth && j + 1 == today}
                    <!-- <td class="today"> -->
                    <!-- <button
                        type="button"
                        class={checkClass == j + 1 ? "today on" : "today"}
                        on:click={selectDay(getDay - getDay + j + 1)}
                        >오늘
                      </button> -->
                    <!-- 오늘
                    </td> -->
                    {#if hlday.includes(j + 1)}
                      <td class="txt_red">오늘</td>
                    {:else if getDay + j == 6}
                      <td class="txt_blue today">오늘</td>
                    {:else if getDay + j == 0}
                      <td class="txt_red today">오늘</td>
                    {:else}
                      <td class="today">오늘</td>
                    {/if}
                  {:else if nowYear == rgYear && nowMonth == rgMonth && j == rgDay}
                    {#if hlday.includes(getDay - getDay + j + 1)}
                      <td class="txt_red">
                        <button
                          type="button"
                          class={checkClass == j + 1 ? "on txt_red" : "txt_red"}
                          on:click={selectDay(getDay - getDay + j + 1)}
                          >{j + 1}
                        </button>
                      </td>
                    {:else if getDay + j == 6}
                      <td class="txt_blue">
                        <button
                          type="button"
                          class={checkClass == j + 1 ? "on txt_blue" : "txt_blue"}
                          on:click={selectDay(getDay - getDay + j + 1)}
                          >{j + 1}
                        </button>
                      </td>
                    {:else if getDay + j == 0}
                      <td class="txt_red">
                        <button
                          type="button"
                          class={checkClass == j + 1 ? "on txt_red" : "txt_red"}
                          on:click={selectDay(getDay - getDay + j + 1)}
                          >{j + 1}
                        </button>
                      </td>
                    {:else}
                      <td>
                        <button
                          type="button"
                          class={checkClass == j + 1 ? "on " : ""}
                          on:click={selectDay(getDay - getDay + j + 1)}
                          >{j + 1}
                        </button>
                      </td>
                    {/if}
                  {:else if hlday.includes(getDay - getDay + j + 1)}
                    <td class="txt_red">
                      <button
                        type="button"
                        class={checkClass == j + 1 ? "on txt_red" : "txt_red"}
                        on:click={selectDay(getDay - getDay + j + 1)}
                        >{j + 1}
                      </button>
                    </td>
                  {:else if getDay + j == 6}
                    <td class="txt_blue">
                      <button
                        type="button"
                        class={checkClass == j + 1 ? "on txt_blue" : "txt_blue"}
                        on:click={selectDay(getDay - getDay + j + 1)}
                        >{j + 1}
                      </button>
                    </td>
                  {:else if getDay + j == 0}
                    <td class="txt_red">
                      <button
                        type="button"
                        class={checkClass == j + 1 ? "on txt_red" : "txt_red"}
                        on:click={selectDay(getDay - getDay + j + 1)}
                        >{j + 1}
                      </button>
                    </td>
                  {:else}
                    <td>
                      <button
                        type="button"
                        class={checkClass == j + 1 ? "on " : ""}
                        on:click={selectDay(getDay - getDay + j + 1)}
                        >{j + 1}
                      </button>
                    </td>
                  {/if}
                {/each}
              {:else}
                {#each Array(7) as d, j}
                  {#if i * 7 - getDay + j + 1 <= lastDay}
                    {#if lastDate < nowDay}
                      {#if hlday.includes(i * 7 - getDay + j + 1)}
                        <td class="txt_red"><span>{i * 7 - getDay + j + 1}</span></td>
                      {:else if j == 6}
                        <td class="txt_blue"><span>{i * 7 - getDay + j + 1}</span></td>
                      {:else if j == 0}
                        <td class="txt_red"><span>{i * 7 - getDay + j + 1}</span></td>
                      {:else}
                        <td><span>{i * 7 - getDay + j + 1}</span></td>
                      {/if}
                    {:else if nowYear == calYear && nowMonth == calMonth && i * 7 - getDay + j + 1 < today}
                      {#if i * 7 - getDay + j + 1 in hashMap}
                        <td class="txt_red"><span>{i * 7 - getDay + j + 1}</span></td>
                      {:else if j == 6}
                        <td class="txt_blue"><span>{i * 7 - getDay + j + 1}</span></td>
                      {:else if j == 0}
                        <td class="txt_red"><span>{i * 7 - getDay + j + 1}</span></td>
                      {:else}
                        <td><span>{i * 7 - getDay + j + 1}</span></td>
                      {/if}
                    {:else if nowYear == calYear && nowMonth == calMonth && i * 7 - getDay + j + 1 == today}
                      <!-- <td class="today"> -->
                      <!-- <button
                          type="button"
                          class={checkClass == i * 7 - getDay + j + 1 ? "on" : ""}
                          on:click={selectDay(i * 7 - getDay + j + 1)}
                          >오늘
                        </button> -->
                      <!-- 오늘
                      </td> -->
                      {#if hlday.includes(i * 7 - getDay + j + 1)}
                        <td class="txt_red"><span>오늘</span></td>
                      {:else if j == 6}
                        <td class="txt_blue"><span>오늘</span></td>
                      {:else if j == 0}
                        <td class="txt_red"><span>오늘</span></td>
                      {:else}
                        <td><span>오늘</span></td>
                      {/if}
                    {:else if nowYear == rgYear && nowMonth == rgMonth && i * 7 - getDay + j + 1 == rgDay}
                      {#if i * 7 - getDay + j + 1 in hashMap}
                        <td class="txt_red"
                          ><span
                            ><button
                              type="button"
                              class={checkClass == i * 7 - getDay + j + 1 ? "on txt_red" : "txt_red"}
                              on:click={selectDay(i * 7 - getDay + j + 1)}
                              >{i * 7 - getDay + j + 1}
                            </button></span
                          ></td
                        >
                      {:else if j == 6}
                        <td class="txt_blue"
                          ><span
                            ><button
                              type="button"
                              class={checkClass == i * 7 - getDay + j + 1 ? "on txt_blue" : "txt_blue"}
                              on:click={selectDay(i * 7 - getDay + j + 1)}
                              >{i * 7 - getDay + j + 1}
                            </button></span
                          ></td
                        >
                      {:else if j == 0}
                        <td class="txt_red"
                          ><span
                            ><button
                              type="button"
                              class={checkClass == i * 7 - getDay + j + 1 ? "on txt_red" : "txt_red"}
                              on:click={selectDay(i * 7 - getDay + j + 1)}
                              >{i * 7 - getDay + j + 1}
                            </button></span
                          ></td
                        >
                      {:else}
                        <td
                          ><span
                            ><button
                              type="button"
                              class={checkClass == i * 7 - getDay + j + 1 ? "on" : ""}
                              on:click={selectDay(i * 7 - getDay + j + 1)}
                              >{i * 7 - getDay + j + 1}
                            </button></span
                          ></td
                        >
                      {/if}
                    {:else if hlday.includes(i * 7 - getDay + j + 1)}
                      <td class="txt_red"
                        ><span
                          ><button
                            type="button"
                            class={checkClass == i * 7 - getDay + j + 1 ? "on txt_red" : "txt_red"}
                            on:click={selectDay(i * 7 - getDay + j + 1)}
                            >{i * 7 - getDay + j + 1}
                          </button></span
                        ></td
                      >
                    {:else if j == 6}
                      <td class="txt_blue"
                        ><span
                          ><button
                            type="button"
                            class={checkClass == i * 7 - getDay + j + 1 ? "on txt_blue" : "txt_blue"}
                            on:click={selectDay(i * 7 - getDay + j + 1)}
                            >{i * 7 - getDay + j + 1}
                          </button></span
                        ></td
                      >
                    {:else if j == 0}
                      <td class="txt_red"
                        ><span
                          ><button
                            type="button"
                            class={checkClass == i * 7 - getDay + j + 1 ? "on txt_red" : "txt_red"}
                            on:click={selectDay(i * 7 - getDay + j + 1)}
                            >{i * 7 - getDay + j + 1}
                          </button></span
                        ></td
                      >
                    {:else}
                      <td
                        ><span
                          ><button
                            type="button"
                            class={checkClass == i * 7 - getDay + j + 1 ? "on" : ""}
                            on:click={selectDay(i * 7 - getDay + j + 1)}
                            >{i * 7 - getDay + j + 1}
                          </button></span
                        ></td
                      >
                    {/if}
                  {/if}
                {/each}
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <select class="time" bind:value={hour}>
      {#if hour == ""}
        <option value={hour}>예약불가</option>
      {:else if hour == "vacation"}
        <option value={hour}>병원휴무</option>
      {:else if hour == "holiday"}
        <option value={hour}>공휴일</option>
      {:else}
        {#each rghour as h}
          <option value={h.htmeFrom}>{h.htmeFrom}~{h.htmeTo}</option>
        {/each}
      {/if}
      <!-- 진료시간 표출 -->
    </select>
  </div>
</div>
{#if popUpWhat == "vacation"}
  <PopUp {popUp}>
    <slot>
      병원 휴무
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <div slot="btns" class="btn_wrap">
      <button type="button" class="mbtn_n_4" name="chbtn" on:click={xButton} id="close">확인</button>
    </div>
  </PopUp>
{/if}
