<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import { alterAddr } from "$lib/js/kakaoMap";
  import { searchType, searchData, searchWhat, searchMount, searchLat, searchLon, location } from "$lib/store/search";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { createEventDispatcher } from "svelte";
  import Daum from "svelte-daum-postcode";
  import PopUp from "./PopUp.svelte";
  import { getGeoPermission } from "$lib/js/phoneAction";
  import { addMapScript, getCurrentPosition } from "$lib/js/mapFunction";
  import { getDow } from "$lib/js/dateFunction";
  import { listUserLocation } from "$lib/store/userLocation";
  import { tick } from "svelte";
  export let lat = 37.4946012;
  export let lon = 127.027561;
  export let isSearchAllowed = true;
  let addr = "";
  let popUp = false;
  let inputElement;
  const dispatch = createEventDispatcher();
  onMount(async () => {
    lat = 37.4946012;
    lon = 127.027561;
    searchMount.set(false);
    await getGeoPermission();
    addMapScript(async () => {
      if ($searchLat == "" || $searchLon == "") {
        await getCurrentPosition((lati, loni) => {
          handlePosition(lati, loni);
        });
      } else {
        lat = $searchLat;
        lon = $searchLon;
        if (isSearchAllowed) {
          searchMount.set(true);
        }
        if (!isSearchAllowed) {
          inputElement.focus();
        }
      }
    });
  });

  function handlePosition(lati, loni) {
    alterAddr(lati, loni); //위치에 따라 동 구하기
    lat = lati;
    lon = loni;
    $searchLat = lati;
    $searchLon = loni;

    if (isSearchAllowed) {
      searchMount.set(true);
    }
    if (($searchType == "D" || $searchType == "P") && isSearchAllowed) {
      searchDrst();
    } else if (($searchType == "H" || $searchType == "K") && isSearchAllowed) {
      searchHspt();
    }
    popUp = false;
  }
  //오늘 날짜 구하기
  function getDate() {
    let date = new Date();
    let dateString =
      date.getFullYear() +
      "년 " +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      "월 " +
      ("0" + date.getDate()).slice(-2) +
      "일 " +
      getDow() +
      "요일";
    return dateString;
  }

  //병원검색
  async function searchHspt() {
    $searchWhat = "A";
    await tick();
    dispatch("searchHspt");
    goto(urlList.searchHsptView);
  }
  //약국검색
  async function searchDrst() {
    $searchWhat = "";
    await tick();
    dispatch("searchDrst");
  }

  /**
   * 주소검색 창에서 주소를 선택 한 후에 선택한 데이터를 input에 추가하는 함수
   * @param detail 선택한 주소의 자세한 정보가 들어가 있는 json
   */
  function addComplete({ detail: { data } }) {
    addr = data.address;
    getAddr(addr);
    $listUserLocation = false;
    popUp = false;
  }

  async function getAddr(addr) {
    const url = "https://dapi.kakao.com/v2/local/search/address.json?query=" + addr;
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: "KakaoAK b87e5db988c66a858cfc810a5269b706" },
    });
    let resData = await res.json();
    lat = resData.documents[0].road_address.y;
    lon = resData.documents[0].road_address.x;
    $searchLat = lat;
    $searchLon = lon;
    if (($searchType == "D" || $searchType == "P") && isSearchAllowed) {
      searchDrst();
    } else if (($searchType == "H" || $searchType == "K") && isSearchAllowed) {
      searchHspt();
    }

    alterAddr(lat, lon); //위치에 따라 동 구하기
  }

  function xButton() {
    popUp = false;
  }
  function enterkeypress(e) {
    if (e.key == "Enter") {
      e.preventDefault();
      if ($searchType == "D" || $searchType == "P") {
        searchDrst();
      } else if ($searchType == "H" || $searchType == "K") {
        searchHspt();
      }
    }
  }

  async function getCurrent() {
    if (typeof Android !== "undefined") {
      await getGeoPermission();
      window.receiveGeoPermission = (permission) => {
        if (permission) {
          getCurrentPosition((lat, lon) => {
            $listUserLocation = true;
            handlePosition(lat, lon);
          });
        } else {
          // 권한이 거부된 경우 기본 위치로 설정
          // lat = 37.5665; // 예: 서울의 위도
          // lon = 126.978; // 예: 서울의 경도
          //남원시청 위치
          let lat = 35.4164245;
          let lon = 127.3904652;
          $listUserLocation = false;
          handlePosition(lat, lon);
        }
      };
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      await getGeoPermission();
      window.receiveLocationPermissionFromIOS = (permission) => {
        if (permission == true) {
          getCurrentPosition((lat, lon) => {
            $listUserLocation = true;
            handlePosition(lat, lon);
          });
        } else {
          // 권한이 거부된 경우 기본 위치로 설정
          lat = 37.5665; // 예: 서울의 위도
          lon = 126.978; // 예: 서울의 경도
          $listUserLocation = false;
          handlePosition(lat, lon);
        }
      };
    } else {
      getCurrentPosition((lat, lon) => {
        $listUserLocation = true;
        handlePosition(lat, lon);
      });
      console.error("Android 인터페이스가 정의되지 않았습니다.");
    }
  }
</script>

<section class="location search">
  <div>
    <form action="">
      <div class="top">
        <button type="button" title="뒤로가기" onclick="history.back();" class="back" />
        {#if $searchType == "D"}
          <input
            type="text"
            placeholder="약국명을 검색하세요."
            bind:value={$searchData}
            on:keydown={enterkeypress}
            bind:this={inputElement}
          />
          <button type="button" class="btn" on:click={searchDrst} />
        {:else if $searchType == "P"}
          <input type="text" value="처방전 제출 약국" readonly />
        {:else}
          <input
            type="text"
            placeholder="진료과, 증상 또는 병원을 검색하세요."
            bind:value={$searchData}
            on:keydown={enterkeypress}
            bind:this={inputElement}
          />
          <button type="button" class="btn" on:click={searchHspt} />
        {/if}
      </div>
      <div>
        <button
          type="button"
          class="mbtn_map_7"
          id=""
          on:click={() => {
            popUp = true;
          }}>{$location}</button
        >
        <button type="button" class="mbtn_data_0">{getDate()}</button>
      </div>
    </form>
  </div>
  {#if $searchType === "D"}
    <!-- <button
      type="button"
      title="지도로"
      class="mbtn_i_map fix_br"
      on:click={() => {
        goto(urlList.uaDrstSrchMap);
      }}
    /> -->
  {:else if $searchType === "H"}
    <button
      type="button"
      title="지도로"
      class="mbtn_i_map fix_br"
      on:click={() => {
        goto(urlList.uaHsptSrchMap);
      }}
    />
  {:else if $searchType === "P"}
    <button
      type="button"
      title="지도로"
      class="mbtn_i_map fix_br"
      on:click={() => {
        goto(urlList.uaPspnMap);
      }}
    />
  {/if}
</section>

<PopUp {popUp}>
  <slot>
    <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    <div class="btn_wrap">
      <button type="button" class="mbtn_7" name="chbtn" id="close" on:click={getCurrent}>현 위치</button>
      <!-- <button type="button" class="mbtn_n" name="chbtn" id="close">기본주소</button> -->
    </div>
  </slot>
  <div slot="btns">
    <Daum autoClose="true" on:complete={addComplete} />
  </div>
</PopUp>
