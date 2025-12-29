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
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  let hsptList = [];
  let popUp = false;
  let popUpWhat = "";
  let favShpId;
  let searchType;
  let searchValue = "";
  let mbrId;
  let jwt;
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          mbrId = result;
          let dayType = new Date().getDay();
          const url =
            /*urlAddr + "8082*/ mobileUrlAddr + "/v1/favShop/selectFavHsptListMobile?favYNA=Y&dayType=" + dayType;
          let resData = await getAPI(url);
          hsptList = resData.resultVO;
          console.log(hsptList);
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
  //바로 삭제 팝업
  function delFav(e) {
    popUp = true;
    favShpId = e;
    popUpWhat = "fav";
  }

  //닫기 버튼
  function xButton() {
    popUp = false;
  }

  //바로 삭제
  async function addDelHspt() {
    let jsonStr = makeStr({ shpId: favShpId, mbrId });
    const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/favShop/delFav";
    let res = await postAPI(url, jsonStr, jwt);
    if (res.resultVO == true) {
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
      "/v1/favShop/selectFavHsptListMobile?mbrId=" +
      mbrId +
      "&favYNA=Y&dayType=" +
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
</script>

<Nav>단골병원 관리</Nav>
<section class="contents">
  <div class="search">
    <div class="set">
      <select id="searchHeader" name="searchHeader" class="sel" bind:value={searchType}>
        <option value="all">전체</option>
        <option value="hosNm">병원명</option>
        <option value="where">지역</option>
      </select>
      <label>
        <input type="text" placeholder="병원명 또는 지역을 검색하세요." class="sear" bind:value={searchValue} />
      </label>
      <button type="button" class="mbtn_o_5" on:click={search}>검색</button>
    </div>
  </div>

  <!-- 병원 리스트 S -->
  {#each hsptList as hspt}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="box_hos" on:click={() => goto(urlList.uaHptDtl + "?shpId=" + hspt.shpId + "&shpType=shp")}>
      <div class="tit">
        <span>{hspt.shpName}</span>
        <p class="ar">
          <span class="bat_favhos" />
        </p>
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
      <div class="btn_wrap">
        <button type="button" class="btn_04" id="show" on:click|stopPropagation={delFav(hspt.shpId)}
          >단골병원 삭제</button
        >
      </div>
    </div>
  {/each}
  <!-- 병원 리스트 E -->
</section>
<PopUp {popUp}>
  <slot
    >단골병원을 삭제 하시겠습니까?
    <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
  </slot>
  <p slot="btns" class="btn_wrap">
    <button type="button" class="mbtn_n_4" id="close" on:click={addDelHspt}>네</button>
    <button type="button" class="mbtn_n_9" id="close" on:click={xButton}>아니오</button>
  </p>
  <p /></PopUp
>
