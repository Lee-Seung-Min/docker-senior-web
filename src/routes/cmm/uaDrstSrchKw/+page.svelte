<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import SearchNav from "$lib/sub/nav/SearchNav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import { page } from "$app/stores";
  import { footCheck } from "$lib/store/navStore.js";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { dgnsType } from "$lib/store/rgstStore.js";
  import { drcpShpId } from "$lib/store/pspnStore.js";
  import { getUserId } from "$lib/js/getUserId";
  import { searchType, searchData, searchWhat, searchMount } from "$lib/store/search";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { chngDistance } from "$lib/js/chngDistance";
  import { getOsType } from "$lib/js/phoneAction";
  import { listUserLocation } from "$lib/store/userLocation";
  import cryptoJs from "crypto-js";
  import { decrypt, encrypt, getEncryptItems } from "$lib/js/aes256";
  import { chngDateTimeSecondsFormat } from "$lib/js/dateFunction";

  let drstList = [];
  let lat = "";
  let lon = "";
  let shpPage = 0;
  let containerRef;
  let noMore = false;
  let date = new Date();
  let isFirstSearch = true;
  // Intersection Observer 설정
  let sentinel;
  let observer;
  let mbrId = 0;
  let encShpLati;
  let encShpLongi;
  let encryptItems = [];
  onMount(async () => {
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then((result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          mbrId = result;
          $footCheck = "menu2";
          $searchType = "D";
          // $searchData = "";
          searchMount.subscribe((value) => {
            if (value && isFirstSearch) {
              search();
              isFirstSearch = false; // 첫 번째 검색 후에는 다음 검색을 막음
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

  //검색
  async function search() {
    noMore = true;
    shpPage = 0;
    encryptItems = getEncryptItems();
    encShpLongi = encrypt(lon, encryptItems);
    encShpLati = encrypt(lat, encryptItems);
    let jsonStr = getSearchJson();
    const url =
      /*urlAddr +
      "8080*/ shopUrlAddr + "/v1/Shop/selectDrugStoreListMobileNew?";
    let resData = await postAPI(url, jsonStr);
    drstList = resData.resultVO;
    noMore = false;
  }

  //자식 component에서 이벤트 발생 시 함수 실행
  const searchDrst = (event) => {
    search();
  };

  //페이징 처리 추가 데이터 불러 오게
  async function loadMoreData() {
    shpPage += 1;
    let jsonStr = getSearchJson();
    const url =
      /*urlAddr +
      "8080*/ shopUrlAddr + "/v1/Shop/selectDrugStoreListMobileNew?";
    let resData = await postAPI(url, jsonStr);
    let newData = resData.resultVO;
    if (newData.length == 0) {
      noMore = true;
    }
    drstList = [...drstList, ...newData];
  }

  //검색 json
  function getSearchJson() {
    if ($listUserLocation) {
      return makeStr({
        shpDay: date.getDay(),
        encShpLati,
        encShpLongi,
        shpName: $searchData,
        shpPage,
        locOs: getOsType(),
        locUseDttm: chngDateTimeSecondsFormat(new Date()),
        locUse: true,
      });
    } else {
      return makeStr({
        shpDay: date.getDay(),
        encShpLati,
        encShpLongi,
        shpName: $searchData,
        shpPage,
        locUse: false,
      });
    }
  }
</script>

<SearchNav bind:lat bind:lon on:searchDrst={searchDrst} />
<section class="contents">
  <div class="list_box" id="pre_list">
    <!-- 약국 정보 S -->
    {#each drstList as drst}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="box_1"
        on:click={() => {
          if (drst.shpYon == "Y") {
            goto(urlList.uaDrstDtl + "?shpId=" + drst.shpId + "&shpType=shp");
          } else if (drst.shpYon == "N") {
            goto(urlList.uaDrstDtl + "?agntId=" + drst.agntId + "&shpType=agnt");
          }
        }}
      >
        <div class="pspnLst">
          <p class="name">{drst.shpName}</p>
          <p class="dept">{drst.shpAddr} {drst.shpAddrDtl} | {chngDistance(drst.shpDist)}</p>
          {#if drst.shFrom != null && drst.shTo != null}
            <p class="time">
              <span>영업시간</span>
              {#if drst.shpTimeType == 1}
                휴무
              {:else}
                {drst.shFrom} ~ {drst.shTo}
              {/if}
            </p>
          {/if}
        </div>
        <!-- {#if drst.shpYon == "Y"}
          <button
            type="button"
            on:click|stopPropagation={() => {
              $drcpShpId = drst.shpId;
              goto(urlList.uaPspnRgst1);
            }}
            class="btn_01">처방전 보내기</button
          >
        {/if} -->
      </div>
    {/each}

    <!-- 약국 정보 E -->
  </div>
  <div bind:this={sentinel} />
</section>
