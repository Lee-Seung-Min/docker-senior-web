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
  import { getDtl, getMap } from "$lib/js/kakaoMap";
  import { getUserId } from "$lib/js/getUserId";
  import { getDow, getNew } from "$lib/js/dateFunction";
  import { getCall, goMap } from "$lib/js/phoneAction";
  import { addMapScript, makeDtlMap } from "$lib/js/mapFunction";
  let shpDtl = [];
  let shpId;
  let agntId;
  let shpType;
  let favChck;
  let mbrId;
  let favName;
  let favId;
  let jwt;
  let popUp = false;
  let call;
  let notiList = [];
  let drstTime = [];
  let dow;
  onMount(async () => {
    shpType = $page.url.searchParams.get("shpType");
    //가맹점일 경우
    if (shpType == "shp") {
      jwt = localStorage.getItem("userJwt");
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          mbrId = result;
          shpId = $page.url.searchParams.get("shpId");
          const url = shopUrlAddr + "/v1/Shop/selectShopInfoMobile?shpId=" + shpId;
          let resData = await getAPI(url);
          shpDtl = resData.resultVO;
          favChck = shpDtl.shpFavYon;
          const notiUrl = adminUrlAddr + "/v1/basicinfo/selectShpNotiList?shpId=" + shpId;
          let notiData = await getAPI(notiUrl);
          notiList = notiData.resultVO;
          const timeUrl = shopUrlAddr + "/v1/Shop/shpDrstTime?shpId=" + shpId;
          let timeData = await getAPI(timeUrl);
          drstTime = timeData.resultVO;
          console.log(drstTime);
          dow = getDow();
        }
      });
    } else {
      //가맹점이 아닌경우
      agntId = $page.url.searchParams.get("agntId");
      const url =
        shopUrlAddr + "/v1/Shop/agntHsptDtl?shpId=" + agntId + "&shpDay=" + new Date().getDay() + "&shpType=D";
      let resData = await getAPI(url);
      shpDtl = resData.resultVO;
      console.log(shpDtl);
      const timeUrl = shopUrlAddr + "/v1/Shop/selectAgentTime?shpId=" + agntId;
      let timeData = await getAPI(timeUrl);
      drstTime = timeData.resultVO;
      console.log(drstTime);
      dow = getDow();
    }
    call = "tel: " + shpDtl.shpTel;
    $footCheck = "";

    console.log(shpDtl);
    addMapScript(() => {
      makeDtlMap(shpDtl.shpLati, shpDtl.shpLongi, "drst");
    });
  });
  //닫기 버튼
  function xPopButton() {
    popUp = false;
  }
  //바로 병원 등록 팝업
  function addFav(name, id) {
    favName = name;
    favId = id;
    if (favChck == "Y") {
      addDelHspt();
    } else {
      addFavHspt();
    }
  }

  //바로병원 등록
  async function addFavHspt() {
    let jsonStr = makeStr({ shpId: favId, mbrId: mbrId, favType: "D" });
    const url = /*urlAddr+ "8082*/ mobileUrlAddr + "/v1/favShop/addFav";
    let res = await postAPI(url, jsonStr, jwt);
    if (res.resultVO == true) {
      popUp = true;
      favChck = "Y";
    }
  }
  //바로 삭제
  async function addDelHspt() {
    let jsonStr = makeStr({ shpId: favId, mbrId });
    const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/favShop/delFav";
    let res = await postAPI(url, jsonStr, jwt);
    if (res.resultVO == true) {
      popUp = true;
      favChck = "N";
    }
  }
</script>

<!-- content S -->
<section class="location">
  <div>
    <h2>
      {shpDtl.shpName}
      <button type="button" title="뒤로가기" onclick="history.back();" class="back" />
      {#if shpType == "shp"}
        <button
          type="button"
          class={favChck == "Y" ? "mark_on" : "mark_off"}
          on:click={addFav(shpDtl.shpName, shpDtl.shpId)}
          title="즐겨찾기"
        />
        <!-- 즐겨찾기 온 mark_off -> mark_on 으로 수정-->
      {/if}
    </h2>
  </div>
</section>
<div class="hos_info_top">
  <div class="box_hos">
    <div class="tit">
      <span>{shpDtl.shpName}</span>
    </div>
    <p class="dept">
      {shpDtl.shpAddr}
      {#if shpDtl.shpAddrDtl != null}{shpDtl.shpAddrDtl}{/if}
    </p>
    <p class="time">
      <span>{dow}요일</span>
      {#if dow == "월"}
        {#if drstTime.wtimeMon == "" || drstTime.wtimeMon == null}
          휴무
        {:else}
          {drstTime.wtimeMon}
        {/if}
      {:else if dow == "화"}
        {#if drstTime.wtimeTue == "" || drstTime.wtimeTue == null}
          휴무
        {:else}
          {drstTime.wtimeTue}
        {/if}
      {:else if dow == "수"}
        {#if drstTime.wtimeWed == "" || drstTime.wtimeWed == null}
          휴무
        {:else}
          {drstTime.wtimeWed}
        {/if}
      {:else if dow == "목"}
        {#if drstTime.wtimeThu == "" || drstTime.wtimeThu == null}
          휴무
        {:else}
          {drstTime.wtimeThu}
        {/if}
      {:else if dow == "금"}
        {#if drstTime.wtimeFri == "" || drstTime.wtimeFri == null}
          휴무
        {:else}
          {drstTime.wtimeFri}
        {/if}
      {:else if dow == "토"}
        {#if drstTime.wtimeSat == "" || drstTime.wtimeSat == null}
          휴무
        {:else}
          {drstTime.wtimeSat}
        {/if}
      {:else if dow == "일"}
        {#if drstTime.wtimeSun == "" || drstTime.wtimeSun == null}
          휴무
        {:else}
          {drstTime.wtimeSun}
        {/if}
      {/if}
    </p>
  </div>
</div>
<section class="contents">
  {#if drstTime.timeYon == "Y"}
    <h3>영업시간</h3>
    <div class="box_2">
      <dl>
        <dt>월요일</dt>
        {#if drstTime.wtimeMon == "" || drstTime.wtimeMon == null}
          <dd>휴무</dd>
        {:else}
          <dd>{drstTime.wtimeMon}</dd>
        {/if}
      </dl>
      <dl>
        <dt>화요일</dt>
        {#if drstTime.wtimeTue == "" || drstTime.wtimeTue == null}
          <dd>휴무</dd>
        {:else}
          <dd>{drstTime.wtimeTue}</dd>
        {/if}
      </dl>
      <dl>
        <dt>수요일</dt>
        {#if drstTime.wtimeWed == "" || drstTime.wtimeWed == null}
          <dd>휴무</dd>
        {:else}
          <dd>{drstTime.wtimeWed}</dd>
        {/if}
      </dl>
      <dl>
        <dt>목요일</dt>
        {#if drstTime.wtimeThu == "" || drstTime.wtimeThu == null}
          <dd>휴무</dd>
        {:else}
          <dd>{drstTime.wtimeThu}</dd>
        {/if}
      </dl>
      <dl>
        <dt>금요일</dt>
        {#if drstTime.wtimeFri == "" || drstTime.wtimeFri == null}
          <dd>휴무</dd>
        {:else}
          <dd>{drstTime.wtimeFri}</dd>
        {/if}
      </dl>
      <dl>
        <dt class="txt_blue">토요일</dt>
        {#if drstTime.wtimeSat == "" || drstTime.wtimeSat == null}
          <dd>휴무</dd>
        {:else}
          <dd>{drstTime.wtimeSat}</dd>
        {/if}
      </dl>
      <dl>
        <dt class="txt_red">일요일</dt>
        {#if drstTime.wtimeSun == "" || drstTime.wtimeSun == null}
          <dd>휴무</dd>
        {:else}
          <dd>{drstTime.wtimeSun}</dd>
        {/if}
      </dl>
    </div>
  {/if}
  {#if shpDtl.shpTel != null}
    <h3>전화번호</h3>
    <div class="box_1">
      {shpDtl.shpTel}
      <div class="ar">
        <button type="button" class="mbtn_n_1" on:click={getCall(shpDtl.shpTel)}>전화하기</button>
      </div>
    </div>
  {/if}
  <!-- <h3>보유장비</h3>
  <div class="box_1">혈압기, 안마기</div> -->

  <h3>위치정보</h3>
  <div class="box_1">
    <p class="text1">
      {shpDtl.shpAddr}
      {#if shpDtl.shpAddrDtl != null}{shpDtl.shpAddrDtl}{/if}
    </p>
    <!-- <p><span class="matro_1" /><span class="matro_7" /> 가산디지털단지</p> -->
    <!-- .matro_1 : 1호선, .matro_2 : 2호선, .matro_3 : 3호선, .matro_4 : 4호선, .matro_5 : 5호선, .matro_6 : 6호선, .matro_7 : 7호선, .matro_8 : 8호선, .matro_9 : 9호선, .matro_n1 인천1호선, .matro_n2 인천2호선, .matro_n3 수인분당호선, .matro_n4 신분당, .matro_n5 경의중앙, .matro_n6 공항철도, .matro_n7 경춘선, .matro_n8 의정부경전철선, .matro_n9 용인경전철, .matro_n10 : 경강선, .matro_n11 : 우이신설경전철, .matro_n12 : 서해선, .matro_n13 : 김포도시철도, .matro_n14 : 신림선 -->
    <div class="map_wrap">
      <div id="map" />
      <button
        type="button"
        class="mbtn_t_2b"
        on:click={() => {
          goMap("https://map.kakao.com/link/map/" + shpDtl.shpName + "," + shpDtl.shpLati + "," + shpDtl.shpLongi);
        }}
      >
        지도보기
      </button>
    </div>

    {#if shpType == "shp"}
      {#if notiList.length > 0}
        <h3>공지사항</h3>
        <div class="list_box" id="noti">
          {#each notiList as noti}
            <button
              type="button"
              class="box_1 type_user"
              on:click={() => {
                goto(urlList.uaNtcDtl + "?ntcId=" + noti.ntcId + "&ntcType=" + noti.ntcType);
              }}
            >
              <p class="tit">
                {noti.ntcTitl}
                {#if getNew(noti.ntcRegDttm)}<span class="new" />{/if}
              </p>
              <p class="data">
                {#if noti.ntcType == "admin"}
                  남원 E-케어
                {:else}
                  {noti.ntcType}
                {/if}
                {noti.ntcRegDttm.substring(2)}
              </p>
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</section>
<!-- content E -->

<!-- 즐겨찾기 S -->
<!-- <section class="full_layer" id="bookMark">
  <div class="bg" />
  <div class="box_1">
    <p>
      <span class="txt_blue">닥터비트의원</span>이<br />
      즐겨찾기에<span class="stay" /> 되었습니다.
    </p>
    <p class="btn_wrap">
      <button type="button" class="mbtn_n_4" id="close">확인</button>
      <button type="button" class="mbtn_n_5" data-url="mark_hos.html">즐겨찾기 보기</button>
    </p>
    <p />
  </div>
</section> -->
<!-- 즐겨찾기 E -->

<PopUp {popUp}>
  <slot>
    <span class="txt_blue">{favName}</span>이<br />
    단골약국에 {#if favChck == "Y"}
      추가{:else}삭제{/if} 되었습니다.
  </slot>
  <slot name="btns">
    <p class="btn_wrap">
      <button type="button" class="mbtn_n_4" on:click={xPopButton}>확인</button>
      <button
        type="button"
        class="mbtn_n_5"
        on:click={() => {
          goto(urlList.uaFavDrstLst);
        }}>단골약국 보기</button
      >
    </p>
    <p />
  </slot>
</PopUp>
