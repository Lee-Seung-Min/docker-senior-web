<script>
  // @ts-nocheck

  import { onMount, tick } from "svelte";
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
  import { drcpShpId, drcpPspnId } from "$lib/store/pspnStore.js";
  import { getMap, popUpShp, popData, mapType, chngMap } from "$lib/js/kakaoMap";
  import { searchLat, searchLon, searchData, hospitalLati, hospitalLongi } from "$lib/store/search";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { pharmacyData } from "$lib/store/pharmacyData";
  import { getGeoPermission } from "$lib/js/phoneAction";
  import { addMapScript, currentHere, makeMap } from "$lib/js/mapFunction";
  import { listUserLocation, mapUserLocation } from "$lib/store/userLocation";

  let popUp = false;
  let popUpWhat = "";
  let favDrst = [];
  //비트 컴퓨터 위치
  // let lat = 37.4946012;
  // let lon = 127.027561;

  //남원시청 위치
  let lat = 35.4164245;
  let lon = 127.3904652;

  let mbrId;
  let week = 0;
  let index = 0;
  let controlsBottom = 5; // map_controls 하단 여백(px)



  onMount(async () => {
    // 쿼리스트링으로 넘어온 pspnId가 있으면 스토어에 보관
    const qPspnId = $page.url?.searchParams?.get && $page.url.searchParams.get("pspnId");
    if (qPspnId) {
      $drcpPspnId = qPspnId;
    }
    //PPSD 활용
    // $mapType = "pspnPha";

    // 심평원 데이터 활용
    $mapType = "pha";
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    week = getWeekOfMonth(new Date());
    try {
      $drcpPspnId = 487
      const pspnId = $drcpPspnId
      //해당 처방 병원 위치를 가져온다.({"sdtlLongi": 병원 경도, "sdtlLati": 병원 위도})
      let result = await getAPI("http://localhost:7000" + "/v1/ppds/ext/getHospitalLocation?pspnId=" + pspnId)
      console.log(result)
      $hospitalLati = result.sdtlLati
      $hospitalLongi = result.sdtlLongi
      // makeMap(result.sdtlLati, result.sdtlLongi);
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

  onMount(() => {
    const onResize = () => adjustControlsBottom();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize);
    }
    // 초기 1회 계산
    adjustControlsBottom();
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onResize);
      }
    };
  });

  function getWeekOfMonth(date) {
    var firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    var firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay();
    var offsetDate = date.getDate() + firstDayOfWeek - 1;
    return Math.ceil(offsetDate / 7);
  }
  function getLaucnTime(e) {
    let openTime = "";
    if (e.startTime != null && e.startTime != "") {
      openTime = e.startTime.slice(0, 5) + " ~ " + e.endTime.slice(0, 5);
    } else {
      openTime = "휴무";
    }
    return openTime;
  }
  function research() {
    $mapUserLocation = false;
    chngMap();
  }

  // 맵 타입 토글 변경
  function setMapType(type) {
    if (!type || $mapType === type) return;
    $popUpShp = false;
    index = 0;
    $mapType = type;
    chngMap();
  }

  // mapType별로 서로 다른 스키마를 뷰 전용으로 매핑
  function mapItemForView(item, type) {
    if (!item) return null;
    if (type === "pspnPha") {
      // PPSD 연동 약국
      return {
        name: item.name ?? "",
        address1: item.address1 ?? "",
        address2: item.address2 ?? "",
        enableYn: item.enableYn ?? "N",
        pharmacyCode: item.pharmacyCode ?? "",
        startTime: item.startTime ?? "",
        endTime: item.endTime ?? "",
      };
    }
    // 심평원 일반 약국
    return {
      name: item.shpName ?? "",
      address1: item.shpAddr ?? item.address1 ?? "",
      address2: item.shpAddrDtl ?? item.address2 ?? "",
      enableYn: (item.shpYon ?? item.enableYn ?? "N") === "Y" ? "Y" : "N",
      pharmacyCode: item.shpId ?? item.pharmacyCode ?? "",
      startTime: item.openStartTime ?? item.startTime ?? "",
      endTime: item.openEndTime ?? item.endTime ?? "",
    };
  }

  // 현재 팝업에 표시할 대상 및 뷰 데이터
  $: currentItem = (Array.isArray($popData) && $popData.length > 0) ? $popData[index % $popData.length] : null;
  $: viewItem = mapItemForView(currentItem, $mapType);

  // 팝업 높이에 따라 컨트롤 하단 위치 계산
  async function adjustControlsBottom() {
    await tick();
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const box = document.querySelector('.map_wrap .box_hos');
    if ($popUpShp && box) {
      const h = box.getBoundingClientRect().height || 0;
  // 모바일 앱 기준: box_hos가 bottom:79px 고정
  const baseBottom = 5;
  controlsBottom = Math.max(20, Math.round(baseBottom + h + 5));
    } else {
      controlsBottom = 5;
    }
  }

  // 팝업 토글/사이즈 변화에 대응
  $: $popUpShp, adjustControlsBottom();
  $: index, adjustControlsBottom();
  $: $popData, adjustControlsBottom();
</script>

<Nav>약국 지정</Nav>
<section class="map_wrap">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="map_controls" style="position:absolute; z-index:99; bottom: {controlsBottom}px; right:5px; background: rgba(255,255,255,0.95); border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); padding: 6px; display:flex; gap:6px;">
    <button type="button" on:click={() => setMapType('pspnPha')} style="min-width:44px; padding:6px 10px; border-radius:6px; border:1px solid #d9d9d9; background: { $mapType === 'pspnPha' ? '#1e90ff' : '#fff' }; color: { $mapType === 'pspnPha' ? '#fff' : '#333' }">연동약국</button>
    <button type="button" on:click={() => setMapType('pha')} style="min-width:44px; padding:6px 10px; border-radius:6px; border:1px solid #d9d9d9; background: { $mapType === 'pha' ? '#1e90ff' : '#fff' }; color: { $mapType === 'pha' ? '#fff' : '#333' }">일반약국</button>
  </div>
  <div
    id="map"
  />
  <button
    type="button"
    on:click={() => {
      $searchData = "";
      goto(urlList.uaPspnRgst);
    }}
    class="search">내 위치 조제가능 약국 보기</button
  >
  <!-- <button
    type="button"
    on:click={() => {
      $searchData = "";
      goto(urlList.uaPspnRgst);
    }}
    class="search_1">약국 검색</button
  >
  <button type="button" class="fav" id="show" on:click={favList}>바로 약국</button> -->
  <button type="button" title="재검색" class="mbtn_t_research" on:click={research}>이 지역 재검색</button>
  <button type="button" title="현재위치" class="mbtn_t_7b" on:click={currentHere} />
  <button
    type="button"
    title="목록으로"
    class="mbtn_i_list"
    on:click={() => {
      goto(urlList.uaPspnRgst);
    }}
  />
  <!-- {#if $popUpShp} -->
   {#if $popUpShp && Array.isArray($popData) && $popData.length > 0}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
      class="box_hos on"
      on:click={() => {
    // 상세 이동 시 원본 데이터를 넘겨 부수 필드 유지
      pharmacyData.set(currentItem);
      console.log("심평원 약국 정보 : ",currentItem);
      if($mapType=="pspnPha"){
        goto($drcpPspnId ? urlList.uaPspnDrstDtl + "?pspnId=" + $drcpPspnId : urlList.uaPspnDrstDtl);
      }
      else if($mapType=="pha"){
        goto(urlList.uaPspnDrstDtl_1);
      }
      }}
      id="druglist"
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
      <div class="tit">
        <span>{viewItem?.name}</span>
      </div>
      <p class="dept">{viewItem?.address1} {viewItem?.address2}</p>
      <p class="time"><span>영업시간</span> {getLaucnTime(viewItem)}</p>
      {#if $mapType == "pspnPha"}
      <!-- {#if $mapType == "pha"} -->
        {#if viewItem?.enableYn == "Y"}
          <div class="btn_wrap">
            <button
              type="button"
              class="btn_01"
              on:click|stopPropagation={() => {
                // 처방전 전송은 연동약국만: 원본 데이터 유지 + 뷰 매핑값으로 shpId 설정
                pharmacyData.set(currentItem);
                $drcpShpId = viewItem?.pharmacyCode;
                goto(urlList.uaPspnRgst1);
              }}>처방전 보내기</button>
          </div>
        {/if}
      {:else if $mapType == "pha"}
          <div class="btn_wrap">
            <button
              type="button"
              class="btn_02"
              on:click|stopPropagation={() => {
                pharmacyData.set(currentItem);
                goto($drcpPspnId ? urlList.uaPspnDrstDtl_1 + "?pspnId=" + $drcpPspnId : urlList.uaPspnDrstDtl);
              }}>상세보기</button>
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

<!-- {#if popUpWhat == "fav"}
  {#if popUp}
    <section class="z_alert">
      <div class="bg" />
      <div class="box_1">
        <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>

        {#each favDrst as fav}
          <div class="box_hos">
            <div class="tit">
              <span>{fav.shpName}</span>
              <p class="ar">
                <span class="bat_favpha" />
              </p>
            </div>
            <p class="dept">{fav.shpAddr} {fav.shpAddrDtl}</p>
            <p class="time"><span>영업시간</span>{getDateTime(fav.operation)}</p>
            <div class="btn_wrap">
              <button
                type="button"
                class="btn_01"
                on:click|stopPropagation={() => {
                  $drcpShpId = fav.shpId;
                  goto(urlList.uaPspnRgst1);
                }}>처방전 보내기</button
              >
            </div>
          </div>
        {/each}
        <div class="clsbtn">
          <button type="button" class="mbtn_r_09" name="chbtn" on:click={xButton}>닫기</button>
        </div>
      </div>
    </section>
  {/if}
{/if} -->
