<script>
  // @ts-nocheck

  import { onDestroy, onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import { footCheck } from "$lib/store/navStore.js"; //밑에 메뉴바 변경 가능하도록
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { dgnsType, wlkYon } from "$lib/store/rgstStore.js";
  import { searchType, searchData, searchWhat } from "$lib/store/search";
  import { getUserId } from "$lib/js/getUserId";
  import ResvPopUp from "$lib/sub/nav/ResvPopUp.svelte";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { getHsptType } from "$lib/js/getHsptType";
  import { getHsptTime } from "$lib/js/getHsptTime";
  import { chngDateFormat, getCurrentDay, getMonthAgo, getYesterDay } from "$lib/js/dateFunction";
  import PageLoader from "$lib/sub/PageLoader.svelte";
  import { getFetch } from "$lib/js/getFetch";
  import { EventSourcePolyfill, NativeEventSource } from "event-source-polyfill";
  export let dgnsList = [];
  export let dateFrom = "";
  export let dateTo = "";
  export let lstType = "";
  let popUp = false;
  let resvPopUp = false;
  let popUpWhat = "";
  let dgnsId = 0;
  let dgnsShpName = "";
  let dgnsShpId = 0;
  let dgnsStat = "";
  let page = 0;
  let noMore = false;
  let dgnsMbrId = 0;
  let dgnsVstYon;
  let dgnsCtlsYon;
  let setDgnsType;
  let hsptType = { ctlsDgns: false, ctlsRsv: false, vstDgns: false, vstRsv: false, ctls: false, visit: false };
  let timeData = { vacation: false, U: false, V: false, W: false, R: false };
  let ctls = false;
  // Intersection Observer 설정
  let sentinel;
  let observer;
  let jwt;

  let isLoading = false;
  let startY = 0;
  let scrollTop = 0;
  let distance = 0;

  let eventSource;
  onMount(async () => {
    $footCheck = "menu1"; //<body class="login menu1"> 위 부분 보고 설정 해줘야 메뉴바 변경
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          dgnsMbrId = result;
          search();
          // gateway 변경전까지 주석처리
          // stream();
          observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
              // 스크롤이 일정 위치에 도달하면 추가 데이터 불러오기
              if (!noMore) {
                loadMoreData();
              }
            }
          });
          if (sentinel) observer.observe(sentinel);
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
  // gateway 변경전까지 주석처리
  // onDestroy(() => {
  //   // SSE 연결 종료 및 서버에 연결 해제 요청
  //   if (eventSource) {
  //     eventSource.close();
  //     const url = mobileUrlAddr + "/v1/sse/disconnectStream?page=dgns";
  //     let resData = postAPI(url, "");
  //     console.log("destroy:" + lstType);
  //   }
  // });
  //진료 예약 팝업
  function doReg(e) {
    popUpWhat = "reg";
    dgnsShpId = e;
    setHsptType();
    chkHsptHday();
    resvPopUp = true;
  }

  //진료 취소 팝업
  function cancelReg(e) {
    dgnsId = e;
    popUpWhat = "cancel";
    popUp = true;
  }
  //진료 취소
  async function cancel() {
    let jsonStr = makeStr({ dgnsId, dgnsStat: 9, dgnsUpdtName: "본인", dgnsCnclRsn: "환자취소" });
    const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/dgns/updateDgnsInfo";
    if (lstType == "current") {
      dateFrom = getCurrentDay();
      dateTo = "";
    } else if (lstType == "past") {
      let yesterDay = getYesterDay();
      dateTo = chngDateFormat(yesterDay);
      let monthAgo = getMonthAgo();
      dateFrom = chngDateFormat(monthAgo);
    }

    dgnsShpId = "";
    dgnsStat = "";
    let res = await postAPI(url, jsonStr, jwt);
    if (res.resultVO == true) {
      popUp = false;
      search();
    }
  }
  //팝업 닫기
  function xButton() {
    popUp = false;
  }
  /*
          전반적으로 search부분 키 입력시 한개 밖에 안눌림 common.js $login 부분이 이유 같음, app.html body 부분에서 login 부분 제거시 키보드 입력 가능, login 부분 제거시 css 달라짐
      */
  async function search() {
    isLoading = true;
    page = 0;
    noMore = true;
    const url =
      /*urlAddr +
        "8082*/ mobileUrlAddr +
      "/v1/dgns/uaMbrDgnsLst?dateFrom=" +
      dateFrom +
      "&dateTo=" +
      dateTo +
      "&dgnsShpName=" +
      dgnsShpName +
      "&dgnsStat=" +
      dgnsStat +
      "&page=" +
      page;
    let resData = await getAPI(url);
    dgnsList = resData.resultVO;
    noMore = false;
    isLoading = false;
  }

  //페이징 처리, 데이터 불러오기
  async function loadMoreData() {
    page += 1;
    const url =
      /*urlAddr +
        "8082*/ mobileUrlAddr +
      "/v1/dgns/uaMbrDgnsLst?dateFrom=" +
      dateFrom +
      "&dateTo=" +
      dateTo +
      "&dgnsShpName=" +
      dgnsShpName +
      "&dgnsStat=" +
      dgnsStat +
      "&page=" +
      page;
    let resData = await getAPI(url);
    let newData = resData.resultVO;
    if (newData.length == 0) {
      noMore = true;
    }
    console.log(newData);
    dgnsList = [...dgnsList, ...newData];
  }

  function enterkeypress(e) {
    if (e.key == "Enter") {
      e.preventDefault();
      search();
    }
  }

  //자식 component에서 이벤트 발생 시 함수 실행
  const dgnsEvent = (event) => {
    console.log("접수!!");
    $dgnsType = setDgnsType;
    $wlkYon = "Y";
    goto(urlList.uaDgnsTdRgst + "?shpId=" + dgnsShpId);
  };

  //자식 component에서 이벤트 발생 시 함수 실행
  const rsvEvent = (event) => {
    console.log("예약!!");
    $dgnsType = setDgnsType;
    $wlkYon = "N";
    goto(urlList.uaDgnsRgst + "?shpId=" + dgnsShpId);
  };

  //접수/예약 가능한 타입 구하기
  async function setHsptType() {
    const getHspt = await getHsptType(dgnsShpId);
    hsptType = getHspt.hsptType;
    ctls = getHspt.ctls;
  }

  //병원 당일 휴무여부 구하기
  async function chkHsptHday() {
    timeData = await getHsptTime(dgnsShpId, setDgnsType);
  }

  // 새로고침
  function handleTouchStart(event) {
    startY = event.touches[0].pageY;
    scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  }

  function handleTouchMove(event) {
    if (scrollTop > 0 || isLoading) return; // 화면 맨 위가 아니거나 이미 새로고침 중이면 무시

    distance = event.touches[0].pageY - startY;
  }

  async function handleTouchEnd() {
    if (scrollTop > 0 || isLoading) return; // 화면 맨 위가 아니거나 이미 새로고침 중이면 무시

    if (distance > 30) {
      // 스와이프 거리가 30px 이상일 때만 새로고침
      await search();
    }
    distance = 0; // 초기화
    startY = 0; // 초기화
  }

  //sse 연결
  async function stream() {
    console.log("connect: " + lstType);
    if (lstType === "current") {
      const url = mobileUrlAddr + "/v1/sse/connectStream?page=dgns";
      const EventSource = EventSourcePolyfill || NativeEventSource;
      eventSource = new EventSource(url, {
        headers: {
          "Content-Type": "text/event-stream",
          "bizportal-access-token": jwt,
        },
        heartbeatTimeout: 3000000,
      });
      eventSource.onopen = function () {
        console.log(new Date() + "SSE connection established");
      };
      eventSource.onerror = function (event) {
        console.log(new Date() + "SSE connection error:", event);
      };
      eventSource.onmessage = function (event) {
        console.log(new Date() + "Received message:", event);
      };
      eventSource.addEventListener("updateDgns", function (event) {
        console.log(new Date() + "Received update event:", event);
        var updateData = JSON.parse(event.data);
        updateDgns(updateData);
      });
      return () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    }
  }

  function updateDgns(updateData) {
    let index = dgnsList.findIndex((item) => item.dgnsId == updateData.dgnsId);
    if (index !== -1) {
      dgnsList[index] = {
        ...dgnsList[index],
        dgnsStat: updateData.dgnsStat,
      };
      console.log(dgnsList[index]);
    }
  }
</script>

<section class="contents" on:touchstart={handleTouchStart} on:touchmove={handleTouchMove} on:touchend={handleTouchEnd}>
  <div class="search">
    {#if lstType == "past"}
      <div class="cal">
        <input type="date" class="datepicker" id="strt_dy" bind:value={dateFrom} />
        ~
        <input type="date" class="datepicker" id="end_dy" bind:value={dateTo} />

        <!-- {#if lstType == "current"}
        <input type="date" class="datepicker" id="strt_dy" bind:value={dateFrom} disabled />
      {:else}
        <input type="date" class="datepicker" id="strt_dy" bind:value={dateFrom} />
      {/if}
      ~
      {#if lstType == "past"}
        <input type="date" class="datepicker" id="end_dy" bind:value={dateTo} disabled />
      {:else}
        <input type="date" class="datepicker" id="end_dy" bind:value={dateTo} />
      {/if} -->
      </div>
    {:else}
      <div>
        <p>화면을 밑으로 당겨 새로고침 하세요.</p>
        <br />
      </div>
    {/if}
    <div class="set">
      <select id="searchHeader" name="searchHeader" class="sel" bind:value={dgnsStat}>
        <option value="">전체</option>
        <option value="3">진료전</option>
        <option value="5">진료중</option>
        <option value="7">진료완료</option>
        <option value="9">취소</option>
      </select>
      <label>
        <input
          type="text"
          placeholder="병원명을 검색하세요"
          class="sear"
          bind:value={dgnsShpName}
          on:keydown={enterkeypress}
        />
      </label>
      <button type="button" class="mbtn_o_5" on:click={search}>검색</button>
    </div>
  </div>
  <div class="list_box clinic_box">
    {#if isLoading}
      <PageLoader />
    {:else}
      {#each dgnsList as dgns}
        <!-- 예약정보 S -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="box_1"
          on:click={() => {
            goto(urlList.uaDgnsDtl + "?dgnsId=" + dgns.dgnsId);
          }}
        >
          <div class="dgnsLst">
            <div class="thumb_box">
              <div class="thumb">
                <!-- <img src={new URL("$lib/img/barodoctor/hospital_00.png", import.meta.url).href} class="img" alt="." /> -->
                <img src={new URL("$lib/img/barodoctor/hospital_00.png", import.meta.url).href} class="img" alt="." />
              </div>
              <div class="btn_box">
                {#if dgns.dgnsStat == 0}
                  {#if dgns.dgnsWlkYon == "Y"}
                    <button
                      type="button"
                      class="mbtn_r"
                      id="show"
                      on:click|stopPropagation={cancelReg(dgns.dgnsId)}
                      value="예약을 취소 하시겠습니까?">접수 취소</button
                    >{:else}
                    <button
                      type="button"
                      class="mbtn_r"
                      id="show"
                      on:click|stopPropagation={cancelReg(dgns.dgnsId)}
                      value="예약을 취소 하시겠습니까?">예약 취소</button
                    >
                  {/if}
                {:else if dgns.dgnsStat == 3}
                  {#if dgns.dgnsWlkYon == "Y"}
                    <button type="button" class="mbtn_t">접수 확정</button>
                  {:else}
                    <button type="button" class="mbtn_t">예약 확정</button>
                  {/if}
                {:else if dgns.dgnsStat == 5}
                  {#if dgns.dgnsType == "U"}
                    <button
                      type="button"
                      class="mbtn_b"
                      on:click|stopPropagation={() => {
                        goto(urlList.uaVdodgnsWt + "?dgnsId=" + dgns.dgnsId);
                      }}>진료시작</button
                    >
                  {:else}
                    <button type="button" class="mbtn_t">진료중</button>
                  {/if}
                {:else if dgns.dgnsStat == 7 && (dgns.mpayStat == 0 || dgns.mpayStat == 7 || dgns.mpayStat == 8 || dgns.mpayStat == 9)}
                  <button
                    type="button"
                    class="mbtn_s"
                    id="show_reg"
                    on:click|stopPropagation={() => {
                      goto(urlList.uaPayMbrDgns + "?dgnsId=" + dgns.dgnsId);
                    }}
                    value="결제 하시겠습니까?">결제</button
                  >
                {:else if dgns.dgnsStat == 7 && dgns.mpayStat == 5}
                  <button
                    type="button"
                    class="mbtn_n"
                    id="show_reg"
                    value="결제 하시겠습니까?">결제완료</button
                  >
                {:else if dgns.dgnsStat == 9}
                  <button
                    type="button"
                    class="mbtn_s"
                    id="show_reg"
                    on:click|stopPropagation={() => {
                      dgnsVstYon = dgns.dgnsVstYon;
                      dgnsCtlsYon = dgns.dgnsCtlsYon;
                      doReg(dgns.dgnsShpId);
                    }}
                    value="어느 방식을 선택하시겠습니까?">접수/예약</button
                  >
                {/if}
              </div>
            </div>
            <div class="info_box">
              <div
                class="box2"
                style=" display: flex;
              flex-wrap: nowrap;
              align-items: center;
              justify-content: flex-start; 
              gap: 3px; 
              overflow-x: auto;"
              >
                {#if dgns.dgnsStat == 3 || dgns.dgnsStat == 0}
                  <span class="bat_state_before" />
                {:else if dgns.dgnsStat == 5}
                  <span class="bat_state_ing" />
                {:else if dgns.dgnsStat == 7}
                  <span class="bat_state_after" />
                {:else if dgns.dgnsStat == 9}
                  <span class="bat_state_cancel" />
                {/if}
                {#if dgns.dgnsType == "V"}
                  <span class="bat_faceY" />
                {:else if dgns.dgnsType == "U"}
                  <span class="bat_faceN" />
                {/if}
                {#if dgns.favType == "H"}
                  <span class="bat_favorite_hspt f_right" />
                {/if}
              </div>
              <p class="name">{dgns.dgnsShpName}</p>
              <p class="subject">{dgns.dgnsDeptName}</p>
              <p class="date">{dgns.dgnsRsvDttm}</p>
              <p class="patient">
                {dgns.dgnsPatName}<small>{dgns.dgnsPatType}</small>
              </p>
              <div class="detail">
                <p>자세히 보기</p>
              </div>
              <br />
            </div>
          </div>
        </div>
        <!-- 예약정보 E -->
      {/each}
    {/if}
    <div bind:this={sentinel} />
  </div>
  <div style="padding:50px" />
  <div class="bottom_btn_fixed">
    <button
      type="button"
      class="newReg"
      id="new"
      on:click={() => {
        $searchType = "H";
        $searchData = "";
        $searchWhat = "A";
        $dgnsType = "";
        goto(urlList.uaHsptSrchMap);
      }}
      value="어느 방식을 선택하시겠습니까?">(신규) 접수 / 예약</button
    >
  </div>
</section>

<!-- 팝업 띄울 때 true 없앨 때 false -->
{#if popUpWhat == "cancel"}
  <PopUp {popUp}>
    <slot
      >예약을 취소 하시겠습니까?
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <div slot="btns" class="btn_wrap">
      <button type="button" class="mbtn_n_4" name="chbtn" on:click={cancel} id="close">예</button>
      <button type="button" class="mbtn_n_9" name="chbtn" on:click={xButton} id="close">아니오</button>
    </div>
  </PopUp>
{:else if popUpWhat == "reg"}
  <ResvPopUp
    {hsptType}
    bind:resvPopUp
    bind:setDgnsType
    bind:timeData
    bind:ctls
    on:dgnsEvent={dgnsEvent}
    on:rsvEvent={rsvEvent}
    shpId={dgnsShpId}
  />
{/if}
