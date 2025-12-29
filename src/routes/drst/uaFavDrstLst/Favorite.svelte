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
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { drcpShpId } from "$lib/store/pspnStore.js";
  import jsQR from "jsqr";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { getCamera } from "$lib/js/phoneAction";
  export let drstList = [];
  export let favType = "A";
  let popUp = false;
  let popUpWhat = "";
  let favShpId;
  let searchType = "all";
  let searchValue = "";
  let mbrId = 0;
  let videoStream = null;
  let stopQR = false;
  let noCamera = "";
  let jwt;
  onMount(async () => {
    console.log("drst");
    $footCheck = "menu3";
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then((result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          mbrId = result;
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
    let jsonStr = makeStr({ shpId: favShpId, mbrId, favType: "D" });
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
      goto(urlList.uaFavHsptLst);
    } else if (res.resultVO == "D") {
      popUp = false;
      searchType = "all";
      searchValue = "";
      search();
    }
  }
  //검색
  async function search() {
    let dayType = new Date().getDay();

    const url =
      /*urlAddr +
      "8082*/ mobileUrlAddr +
      "/v1/favShop/selectFavDrstListMobile?favYNA=" +
      favType +
      "&shpDay=" +
      dayType +
      "&searchType=" +
      searchType +
      "&shpSido=" +
      searchValue +
      "&shpName=" +
      searchValue;
    let resData = await getAPI(url);
    drstList = resData.resultVO;
    console.log(drstList);
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
      console.log("error" + error);
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
          goto(urlList.uaFavDrstMng);
        }}><img src={new URL("/src/assets/img/icon_setting.svg", import.meta.url).href} class="img" alt="." /></button
      >
    </div>
  </div>
  <div class="search">
    <div class="set">
      <select id="searchHeader" name="searchHeader" class="sel" bind:value={searchType}>
        <option value="all">전체</option>
        <option value="phaNm">약국명</option>
        <option value="where">지역</option>
      </select>
      <label>
        <input
          type="text"
          placeholder="약국명 또는 지역을 검색하세요."
          class="sear"
          bind:value={searchValue}
          on:keydown={enterkeypress}
        />
      </label>
      <button type="button" class="mbtn_o_5" on:click={search}>검색</button>
    </div>
  </div>
  <!-- 약국 리스트 S -->
  {#each drstList as drst}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="box_hos" on:click={() => goto(urlList.uaDrstDtl + "?shpId=" + drst.shpId + "&shpType=shp")}>
      <div class="tit">
        <span>{drst.shpName}</span>
        <p class="ar">
          {#if drst.favYon == "N"}
            <span class="bat_visitpha" />
          {:else if drst.favYon == "Y"}
            <span class="bat_favpha" />
          {/if}
        </p>
      </div>
      <p class="dept">{drst.shpAddr} {drst.shpAddrDtl}</p>
      <p class="time"><span>영업시간</span> {drst.shFrom} ~ {drst.shTo}</p>
      <div class="btn_wrap inline">
        {#if drst.favYon == "N"}
          <button
            type="button"
            class="btn_04"
            id="show"
            value="단골약국으로 추가하시겠습니까?"
            on:click|stopPropagation={addFav(drst.shpId)}
            >단골약국 추가
          </button>
        {/if}
        <button
          type="button"
          class="btn_02"
          id="show_reg"
          on:click|stopPropagation={() => {
            popUpWhat = "pspn";
            popUp = true;
            // $drcpShpId = drst.shpId;
            // goto(urlList.uaPspnNSend);
          }}>처방전 보내기</button
        >
      </div>
    </div>
  {/each}

  <!-- 약국 리스트 E -->
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
      >단골약국으로 추가하시겠습니까?<button type="button" class="alert_close" on:click={xButton}
        ><i class="xi-close-min" /></button
      >
    </slot>
    <p slot="btns" class="btn_wrap" id="btn">
      <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={addFavQR}>예</button>
      <button type="button" class="mbtn_n_9" name="chbtn" id="close" on:click={xButton}>아니오</button>
    </p>
    <p />
  </PopUp>
{:else if popUpWhat == "pspn"}
  <PopUp {popUp}>
    서비스 준비중입니다.
    <button type="button" class="alert_close" on:click={xButton}>
      <i class="xi-close-min" />
    </button>
    <p class="btn_wrap" id="btn" slot="btns">
      <button type="button" class="mbtn_n_4" id="close" on:click={xButton}>확인</button>
    </p>
  </PopUp>
{/if}
