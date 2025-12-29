<script>
  // @ts-nocheck

  import { afterUpdate, onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import { page } from "$app/stores";
  import { footCheck } from "$lib/store/navStore.js";
  import { getDow } from "$lib/js/dateFunction";
  import { dgnsType, wlkYon } from "$lib/store/rgstStore.js";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import jsQR from "jsqr";
  import { getUserId } from "$lib/js/getUserId";
  import ResvPopUp from "$lib/sub/nav/ResvPopUp.svelte";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { getHsptType } from "$lib/js/getHsptType";
  import { getHsptTime } from "$lib/js/getHsptTime";
  import { getCamera } from "$lib/js/phoneAction";

  export let hsptList = [];
  export let favType = "A";
  let popUp = false;
  let resvPopUp = false;
  let popUpWhat = "";
  let dgnsShpId;
  let favShpId;
  let searchType;
  let searchValue = "";
  let mbrId = 0;
  let videoStream = null;
  let stopQR = false;
  let noCamera = "";
  let setDgnsType;
  let hsptType = { ctlsDgns: false, ctlsRsv: false, vstDgns: false, vstRsv: false, ctls: false, visit: false };
  let timeData = { vacation: false, U: false, V: false, W: false, R: false };
  let ctls = false;
  let jwt;
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then((result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          mbrId = result;
          $footCheck = "menu3";
          let qrShpId = $page.url.searchParams.get("qrShpId");
          console.log(qrShpId);
          if (qrShpId != "" && qrShpId != null) {
            favShpId = qrShpId;
            popUpWhat = "qrFav";
            popUp = true;
          }
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
  //진료예약 팝업
  function doReg(e) {
    dgnsShpId = e;
    popUpWhat = "reg";
    setHsptType();
    chkHsptHday();
    resvPopUp = true;
  }
  //바로 등록 팝업
  function addFav(e) {
    popUp = true;
    favShpId = e;
    popUpWhat = "fav";
  }
  //팝업 닫기
  function xButton() {
    popUp = false;
    popUpWhat = "";
    stopQR = true;
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      videoStream = null;
    }
  }
  //바로 등록
  async function addFavHspt() {
    let jsonStr = makeStr({ shpId: favShpId, mbrId, favType: "H" });
    const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/favShop/addFav";
    let res = await postAPI(url, jsonStr, jwt);
    if (res.resultVO == true) {
      popUp = false;
      searchType = "all";
      searchValue = "";
      search();
    }
  }
  //QR 바로 등록
  async function addFavQR() {
    let jsonStr = makeStr({ shpId: favShpId, mbrId });
    const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/favShop/addFavQR";
    let res = await postAPI(url, jsonStr, jwt);
    if (res.resultVO == "H") {
      popUp = false;
      searchType = "all";
      searchValue = "";
      search();
    } else if (res.resultVO == "D") {
      popUp = false;
      goto(urlList.uaFavDrstLst);
    }
  }
  //검색
  async function search() {
    let dayType = new Date().getDay();

    const url =
      /*urlAddr +
      "8082*/ mobileUrlAddr +
      "/v1/favShop/selectFavHsptListMobile?favYNA=" +
      favType +
      "&dayType=" +
      dayType +
      "&searchType=" +
      searchType +
      "&shpSido=" +
      searchValue +
      "&shpName=" +
      searchValue;
    let resData = await getAPI(url);
    hsptList = resData.resultVO;
    console.log(hsptList);
  }

  function openVideo() {
    popUp = true;
    popUpWhat = "videoOpen";
    stopQR = false;
    noCamera = "";
  }

  async function getQR() {
    if (stopQR) {
      return;
    }
    const video = document.getElementById("video");
    const canvasElement = document.getElementById("canvas");
    const canvas = canvasElement.getContext("2d", { willReadFrequently: true });
    try {
      if (!video.srcObject) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        videoStream = stream;
        video.srcObject = stream;
        video.setAttribute("playsinline", true);
        await video.play();
      }
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

      // 캔버스 이미지 데이터를 가져옵니다.
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

      // QR 코드 스캔 로직
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        let qrData = code.data;
        console.log("스캔된 QR 코드:", qrData);
        let params = new URLSearchParams(new URL(qrData).search);
        let qrShpId = params.get("qrShpId");
        console.log(qrShpId);
        if (qrShpId != "" && qrShpId != null) {
          favShpId = qrShpId;
          if (videoStream) {
            videoStream.getTracks().forEach((track) => track.stop());
            videoStream = null;
          }
          popUpWhat = "qrFav";
          stopQR = true;
          return;
        }
      }
      // 다음 프레임에서 QR 코드 스캔을 계속 수행합니다.
      requestAnimationFrame(getQR);
    } catch (error) {
      console.error("카메라 접근에 실패하였습니다.", error);
      stopQR = true;
      videoStream = null;
      noCamera = "카메라 접근에 실패하였습니다.";
    }
  }
  afterUpdate(async () => {
    if (popUp && popUpWhat == "videoOpen") {
      getQR();
    }
  });
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
</script>

<section class="contents">
  <div class="setting">
    <div class="set">
      <button
        type="button"
        class="mbtn_t"
        on:click={() => {
          getCamera((permission) => {
            if (permission) {
              console.log(permission);
              openVideo();
            }
          });
        }}>QR코드</button
      >
      <button
        type="button"
        on:click={() => {
          goto(urlList.uaFavHsptMng);
        }}><img src={new URL("/src/assets/img/icon_setting.svg", import.meta.url).href} class="img" alt="." /></button
      >
    </div>
  </div>
  <div class="search">
    <div class="set">
      <select id="searchHeader" name="searchHeader" class="sel" bind:value={searchType}>
        <option value="all">전체</option>
        <option value="hosNm">병원명</option>
        <option value="where">지역</option>
      </select>
      <label>
        <input
          type="text"
          placeholder="병원명 또는 지역을 검색하세요."
          class="sear"
          bind:value={searchValue}
          on:keydown={enterkeypress}
        />
      </label>
      <button type="button" class="mbtn_o_5" on:click={search}>검색</button>
    </div>
  </div>
  <!-- 병원 리스트 S -->
  {#each hsptList as hspt}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="box_hos" on:click={() => goto(urlList.uaHptDtl + "?shpId=" + hspt.shpId + "&shpType=shp")}>
      <div class="ti">
        <span>
          <p class="ar">
            {#if hspt.favYon == "N"}
              <span class="bat_visithos" />
            {:else if hspt.favYon == "Y"}
              <span class="bat_favhos" />
            {/if}
          </p>
        </span>
      </div>
      <div class="ti">
        <span>{hspt.shpName}</span>
      </div>
      <p class="dept">{hspt.shpDepts}</p>
      <p class="time">
        <span>{getDow()}요일</span>
        {#if hspt.shpWTime == null}
          휴무
        {:else}
          {hspt.shpWTime}
          {#if hspt.shpLTime != null}<span>점심시간</span>
            {hspt.shpLTime}
          {/if}
        {/if}
      </p>
      <div class="btn_wrap inline">
        {#if hspt.favYon == "N"}
          <button
            type="button"
            class="btn_04"
            id="show"
            value="단골병원으로 추가하시겠습니까?"
            on:click|stopPropagation={addFav(hspt.shpId)}
            >단골병원 추가
          </button>
        {/if}
        <button
          type="button"
          class="btn_01"
          id="show_reg"
          value="어느 방식을 선택하시겠습니까?"
          on:click|stopPropagation={doReg(hspt.shpId)}>진료 접수 / 예약</button
        >
      </div>
    </div>
  {/each}

  <!-- 병원 리스트 E -->
</section>

{#if popUpWhat == "fav"}
  <PopUp {popUp}>
    <slot
      >단골병원으로 추가하시겠습니까?<button type="button" class="alert_close" on:click={xButton}
        ><i class="xi-close-min" /></button
      >
    </slot>
    <p slot="btns" class="btn_wrap" id="btn">
      <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={addFavHspt}>예</button>
      <button type="button" class="mbtn_n_9" name="chbtn" id="close" on:click={xButton}>아니오</button>
    </p>
    <p />
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

  <!-- <PopUp {popUp}>
    <slot
      >어느 방식을 선택하시겠습니까?
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <p slot="btns" class="btn_wrap" id="btn">
      <button
        type="button"
        class="btn_04"
        name="chbtn"
        id="visit"
        on:click={() => {
          goto(urlList.uaDgnsRgst + "?shpId=" + dgnsShpId + "&dgnsType=V");
        }}>방문진료</button
      >
      <button
        type="button"
        class="btn_01"
        name="chbtn"
        id="remote"
        on:click={() => {
          goto(urlList.uaDgnsRgst + "?shpId=" + dgnsShpId + "&dgnsType=U");
        }}>비대면진료</button
      >
    </p>
  </PopUp> -->
{:else if popUpWhat == "videoOpen"}
  <!-- svelte-ignore a11y-media-has-caption -->
  {#if popUp}
    <section class="z_alert">
      <div class="box_1">
        <p>{noCamera}</p>
        <p><button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button></p>
        <video id="video" width="300" height="300" playsinline style="display: none;" />
        <canvas id="canvas" width="300" height="300" />
      </div>
    </section>
  {/if}
{:else if popUpWhat == "qrFav"}
  <PopUp {popUp}>
    <slot
      >단골병원으로 추가하시겠습니까?<button type="button" class="alert_close" on:click={xButton}
        ><i class="xi-close-min" /></button
      >
    </slot>
    <p slot="btns" class="btn_wrap" id="btn">
      <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={addFavQR}>예</button>
      <button type="button" class="mbtn_n_9" name="chbtn" id="close" on:click={xButton}>아니오</button>
    </p>
    <p />
  </PopUp>
{/if}
