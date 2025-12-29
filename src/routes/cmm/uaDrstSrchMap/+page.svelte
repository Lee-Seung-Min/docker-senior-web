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
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { drcpShpId } from "$lib/store/pspnStore.js";
  import { getMap, popUpShp, popData, mapType, chngMap } from "$lib/js/kakaoMap";
  import { searchData, searchLat, searchLon } from "$lib/store/search";
  import { getGeoPermission } from "$lib/js/phoneAction";
  import { addMapScript, currentHere, getCurrentPosition, makeMap } from "$lib/js/mapFunction";
  import { listUserLocation, mapUserLocation } from "$lib/store/userLocation";

  let popUp = false;
  let lat = 37.4946012;
  let lon = 127.027561;
  onMount(async () => {
    $footCheck = "";
    $mapType = "pha";
    try {
      getGeoPermission();
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

    $popUpShp = false;
  });

  function research() {
    $mapUserLocation = false;
    chngMap();
  }
</script>

<Nav>약국찾기</Nav>
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
      goto(urlList.uaDrstSrchKw);
      $searchData = "";
    }}
    class="search">약국명 검색</button
  >

  <div class="selet">
    <button
      type="button"
      on:click={() => {
        goto(urlList.uaHsptSrchMap);
        $searchData = "";
      }}>병원</button
    >
    <button type="button" class="on">약국</button>
  </div>
  <button type="button" title="재검색" class="mbtn_t_research" on:click={research}>이 지역 재검색</button>
  <button type="button" title="현재위치" class="mbtn_t_7b" on:click={currentHere} />
  <button
    type="button"
    title="목록으로"
    class="mbtn_i_list"
    on:click={() => {
      goto(urlList.uaDrstSrchKw);
    }}
  />
  {#if $popUpShp}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="box_hos on"
      on:click={() => {
        if ($popData.shpYon == "Y") {
          goto(urlList.uaDrstDtl + "?shpId=" + $popData.shpId + "&shpType=shp");
        } else if ($popData.shpYon == "N") {
          goto(urlList.uaDrstDtl + "?agntId=" + $popData.agntId + "&shpType=agnt");
        }
      }}
    >
      <div class="tit">
        <span>{$popData.shpName}</span>
      </div>
      <p class="dept">{$popData.shpAddr} {$popData.shpAddrDtl}</p>
      <p class="time">
        {#if $popData.shFrom != null}
          <span>영업시간</span>
          {#if $popData.shpTimeType == 1}
            휴무
          {:else}
            {$popData.shFrom} ~ {$popData.shTo}
          {/if}
        {/if}
      </p>

      <!-- {#if $popData.shpYon != "N"}
        <div class="btn_wrap">
          <button
            type="button"
            class="btn_01"
            on:click|stopPropagation={() => {
              $drcpShpId = $popData.shpId;
              goto(urlList.uaPspnNSend);
            }}>처방전 보내기</button
          >
        </div>
      {/if} -->
    </div>
  {/if}
</section>
