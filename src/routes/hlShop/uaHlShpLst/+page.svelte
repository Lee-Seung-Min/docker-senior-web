<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import { alterAddr } from "$lib/js/kakaoMap";
  import Daum from "svelte-daum-postcode";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import { page } from "$app/stores";
  import { footCheck } from "$lib/store/navStore.js";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { location, firstLocation, secondLocation, searchLat, searchLon } from "$lib/store/search";
  import { hlShop } from "$lib/store/hlShop";
  let shpList = [];
  let lat = "";
  let lon = "";
  let shpPage = 1;
  let popUp = false;
  let containerRef;
  let noMore = false;
  let date = new Date();
  let isFirstSearch = true;
  let addr = "";
  // Intersection Observer 설정
  let sentinel;
  let observer;
  let mbrId = 0;
  onMount(async () => {
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");

    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          if ($searchLat == "" && $searchLon == "" && ($location == "" || $location == null)) {
            await getCurrentPosition();
            console.log(11111);
          } else {
            lat = $searchLat;
            lon = $searchLon;
            console.log(11111);
            search();
          }

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
    mbrId = await getUserId(jwt);
  });

  //검색
  async function search() {
    noMore = true;
    shpPage = 1;
    const url =
      /*urlAddr +
      "8080*/ shopUrlAddr +
      "/v1/hlShop/getHlShop?page=" +
      shpPage +
      "&firstLocation=" +
      $firstLocation +
      "&secondLocation=" +
      $secondLocation;
    console.log(url);
    let resData = await getAPI(url);
    console.log(resData);
    shpList = resData.resultVO;
    console.log(shpList);
    noMore = false;
  }

  //페이징 처리 추가 데이터 불러 오게
  async function loadMoreData() {
    shpPage += 1;
    const url =
      /*urlAddr +
      "8080*/ shopUrlAddr +
      "/v1/hlShop/getHlShop?page=" +
      shpPage +
      "&firstLocation=" +
      $firstLocation +
      "&secondLocation=" +
      $secondLocation;
    let resData = await getAPI(url);
    let newData = resData.resultVO;
    if (newData.length == 0) {
      noMore = true;
    }
    shpList = [...shpList, ...newData];
  }
  /**
   * 주소검색 창에서 주소를 선택 한 후에 선택한 데이터를 input에 추가하는 함수
   * @param detail 선택한 주소의 자세한 정보가 들어가 있는 json
   */
  function addComplete({ detail: { data } }) {
    addr = data.address;
    getAddr(addr);
    popUp = false;
  }
  function xButton() {
    popUp = false;
  }
  async function getAddr(addr) {
    const url = "https://dapi.kakao.com/v2/local/search/address.json?query=" + addr;
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: "KakaoAK b87e5db988c66a858cfc810a5269b706" },
    });
    let resData = await res.json();
    console.log(resData);
    lat = resData.documents[0].road_address.y;
    lon = resData.documents[0].road_address.x;
    $searchLat = lat;
    $searchLon = lon;
    await alterAddr(lat, lon); //위치에 따라 동 구하기
    search();
  }
  //현재 위치 구하기
  async function getCurrentPosition() {
    await navigator.geolocation.getCurrentPosition((position) => {
      lat = position.coords.latitude;
      lon = position.coords.longitude;
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=61293c54f9207fc7739fb7c9618d457c&autoload=false";
      document.head.appendChild(script);
      script.onload = async () => {
        await alterAddr(lat, lon); //위치에 따라 동 구하기
        $searchLat = lat;
        $searchLon = lon;
        search();
      };
      popUp = false;
    });
  }
</script>

<Nav>추석 연휴 병원 / 약국</Nav>
<section class="contents">
  <button
    type="button"
    class="mbtn_b_7"
    id=""
    on:click={() => {
      popUp = true;
    }}
    >주소 선택: {$secondLocation}
  </button>

  <br />
  <br />
  이 정보는 공공데이터 포털(https://www.data.go.kr/)에서 가져오는 자료입니다.
  <br />
  <br />
  <div class="list_box" id="pre_list">
    <!-- 연휴 병원/약국 정보 S -->
    {#each shpList as shp}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="box_1"
        on:click={() => {
          $hlShop = shp;
          goto(urlList.uaHlShpDtl);
        }}
      >
        <div class="pspnLst">
          <p class="name">{shp.dutyName}</p>
          <p class="dept">{shp.dutyAddr}</p>
        </div>
      </div>
    {/each}

    <!--  연휴 병원/약국 정보 E -->
  </div>
  <div bind:this={sentinel} />
</section>
<PopUp {popUp}>
  <slot>
    <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    <div class="btn_wrap">
      <button type="button" class="mbtn_7" name="chbtn" id="close" on:click={getCurrentPosition}>현 위치</button>
      <!-- <button type="button" class="mbtn_n" name="chbtn" id="close">기본주소</button> -->
    </div>
  </slot>
  <div slot="btns">
    <Daum height="500px" autoClose="true" on:complete={addComplete} />
  </div>
</PopUp>
