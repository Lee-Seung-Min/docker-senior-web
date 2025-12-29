<script>
  // @ts-nocheck

  import { onMount } from "svelte";
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
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { drcpShpId } from "$lib/store/pspnStore.js";
  import { dgnsType, wlkYon } from "$lib/store/rgstStore.js";
  import { getMap, popData, mapType, popUpShp, chngMap } from "$lib/js/kakaoMap";
  import { searchData, searchLat, searchLon } from "$lib/store/search";
  import ResvPopUp from "$lib/sub/nav/ResvPopUp.svelte";
  import { getHsptType } from "$lib/js/getHsptType";
  import { getHsptTime } from "$lib/js/getHsptTime";
  import { getGeoPermission } from "$lib/js/phoneAction";
  import { addMapScript, currentHere, getCurrentPosition, makeMap } from "$lib/js/mapFunction";
  import { listUserLocation, mapUserLocation } from "$lib/store/userLocation";
  let lat = 37.4946012;
  let lon = 127.027561;
  let type;
  let resvPopUp = false;
  let popUpWhat = "";
  let hsptShpId;
  let shpCtlsYon;
  let shpVstYon;
  let setDgnsType;
  let hsptType = { ctlsDgns: false, ctlsRsv: false, vstDgns: false, vstRsv: false, ctls: false, visit: false };
  let timeData = { vacation: false, U: false, V: false, W: false, R: false };
  let ctls = false;
  let index = 0;
  onMount(async () => {
    $footCheck = "";
    $mapType = "hspt";
    try {
      await getGeoPermission();
      addMapScript(async () => {
        $mapUserLocation = $listUserLocation;
        if ($searchLat == "" || $searchLon == "") {
          await currentHere();
        } else {
          lat = $searchLat;
          lon = $searchLon;
          makeMap(lat, lon);
        }
      });
    } catch (error) {
      console.error("Error getting geolocation:", error);
    }

    dgnsType.subscribe((value) => {
      if (value == "V") {
        type = "V";
      } else if (value == "U") {
        type = "U";
      } else {
        type = "";
      }
    });

    $popUpShp = false;
  });

  //닫기 버튼
  function xButton() {
    popUp = false;
  }

  //진료 예약 팝업
  function doReg(e) {
    popUpWhat = "reg";
    hsptShpId = e;
    setHsptType();
    chkHsptHday();
    resvPopUp = true;
  }
  //자식 component에서 이벤트 발생 시 함수 실행
  const dgnsEvent = (event) => {
    $dgnsType = setDgnsType;
    $wlkYon = "Y";
    goto(urlList.uaDgnsTdRgst + "?shpId=" + hsptShpId);
  };

  //자식 component에서 이벤트 발생 시 함수 실행
  const rsvEvent = (event) => {
    $dgnsType = setDgnsType;
    $wlkYon = "N";
    goto(urlList.uaDgnsRgst + "?shpId=" + hsptShpId);
  };

  //접수/예약 가능한 타입 구하기
  async function setHsptType() {
    const getHspt = await getHsptType(hsptShpId);
    hsptType = getHspt.hsptType;
    ctls = getHspt.ctls;
  }

  //병원 당일 휴무여부 구하기
  async function chkHsptHday() {
    timeData = await getHsptTime(hsptShpId, setDgnsType);
  }

  function research() {
    $mapUserLocation = false;
    chngMap();
  }
</script>

<Nav>병원찾기</Nav>
<section class="map_wrap">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    id="map"
    on:click={() => {
      $popUpShp = false;
    }}
  />

  <button
    type="button"
    on:click={() => {
      $dgnsType = "";
      goto(urlList.uaHsptSrch);
    }}
    class="search">증상 또는 병원명 검색</button
  >

  <div class="selet">
    <button type="button" class="on">병원</button>
    <button
      type="button"
      on:click={() => {
        goto(urlList.uaDrstSrchMap);
        $searchData = "";
      }}>약국</button
    >
  </div>
  <button type="button" title="현재위치" class="mbtn_t_research" on:click={research}>이 지역 재검색</button>
  <button type="button" title="현재위치" class="mbtn_t_7b" on:click={currentHere} />
  <button
    type="button"
    title="목록으로"
    class="mbtn_i_list"
    on:click={() => {
      goto(urlList.searchHsptView);
    }}
  />
  {#if $popUpShp}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="box_hos on"
      on:click={() => {
        if ($popData[index % $popData.length].shpYon == "Y") {
          goto(urlList.uaHptDtl + "?shpId=" + $popData[index % $popData.length].shpId + "&shpType=shp");
        } else {
          goto(urlList.uaHptDtl + "?agntId=" + $popData[index % $popData.length].agntId + "&shpType=agnt");
        }
      }}
    >
      {#if $popData.length != 1}
        <button
          class="leftArrow innerArrowPosition innerLeftArrow"
          on:click|stopPropagation={() => {
            index -= 1;
            if (index < 0) index = $popData.length - 1;
          }}
        ></button>
      {/if}
      <div class="ti">
        <span>
          <p class="ar">
            {#if $popData[index % $popData.length].shpVstYon == "Y"}
              <span class="bat_faceY" />
            {/if}
            {#if $popData[index % $popData.length].shpCtlsYon == "Y"}
              <span class="bat_faceN" />
            {/if}
          </p>
        </span>
      </div>
      <div class="ti">
        <span>{$popData[index % $popData.length].shpName}</span>
      </div>
      <p class="dept">{$popData[index % $popData.length].shpDepts}</p>
      <p class="time">
        <span>{getDow()}요일</span>
        {#if $popData[index % $popData.length].shpWTime == null}
          휴무
        {:else}
          {$popData[index % $popData.length].shpWTime}
          {#if $popData[index % $popData.length].shpLTime != null}<span>점심시간</span>
            {$popData[index % $popData.length].shpLTime}
          {/if}
        {/if}
      </p>
      {#if $popData[index % $popData.length].shpId != null}
        <div class="btn_wrap">
          <button
            type="button"
            on:click|stopPropagation={() => {
              // if (type != "") {
              //   goto(urlList.uaDgnsRgst + "?shpId=" + $popData.shpId);
              // } else {
              shpCtlsYon = $popData[index % $popData.length].shpCtlsYon;
              shpVstYon = $popData[index % $popData.length].shpVstYon;
              doReg($popData[index % $popData.length].shpId);
              //}
            }}
            class="btn_01">진료 접수 / 예약</button
          >
        </div>
      {/if}
      {#if $popData.length != 1}
        <button
          class="rightArrow innerArrowPosition innerRightArrow"
          on:click|stopPropagation={() => {
            index += 1;
            if (index >= $popData.length) {
              index = 0;
            }
          }}
        ></button>
      {/if}
    </div>
  {/if}
</section>

{#if popUpWhat == "reg"}
  <ResvPopUp
    {hsptType}
    bind:resvPopUp
    bind:setDgnsType
    bind:timeData
    bind:ctls
    on:dgnsEvent={dgnsEvent}
    on:rsvEvent={rsvEvent}
    shpId={hsptShpId}
  />

  <!-- <PopUp {popUp}>
    <slot
      >어느 방식을 선택하시겠습니까?
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <div slot="btns" class="btn_wrap">
      {#if shpVstYon == "Y"}
        <button
          type="button"
          class="btn_04"
          name="chbtn"
          id="visit"
          on:click={() => {
            $dgnsType = "V";
            goto(urlList.uaDgnsRgst + "?shpId=" + hsptShpId);
          }}>방문진료</button
        >
      {/if}
      {#if shpCtlsYon == "Y"}
        <button
          type="button"
          class="btn_01"
          name="chbtn"
          id="remote"
          on:click={() => {
            $dgnsType = "U";
            goto(urlList.uaDgnsRgst + "?shpId=" + hsptShpId);
          }}>비대면진료</button
        >
      {/if}
    </div>
  </PopUp> -->
{/if}
