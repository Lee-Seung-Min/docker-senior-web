<script>
  // @ts-nocheck
  import { hlShop } from "$lib/store/hlShop";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { getDtl } from "$lib/js/kakaoMap";
  import { onMount } from "svelte";
  import { getCall, goMap } from "$lib/js/phoneAction";
  let lat;
  let lon;
  let shop = [];
  onMount(async () => {
    hlShop?.subscribe((value) => {
      shop = value;
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=61293c54f9207fc7739fb7c9618d457c&autoload=false";
    document.head.appendChild(script);
    script.onload = async () => {
      getAddr(shop.dutyAddr.split(",")[0]);
    };
  });
  //지도 불러오기
  async function makeMap() {
    let type = "hspt";
    if (shop.dutyDiv == "H") {
      type = "drst";
    }
    kakao.maps.load(() => {
      getDtl(lat, lon, type); //kakaoMap.js에 있는 지도 호출함수 실행
    });
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
    makeMap();
  }
</script>

<Nav>{shop.dutyName}</Nav>
<section class="contents">
  <h3>영업시간</h3>
  <div class="box_2">
    <dl>
      {#if shop.dutyDay1 != null}
        <dt>{shop.dutyDay1}</dt>
        {#if shop.dutyDaytime1 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime1}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay2 != null}
        <dt>{shop.dutyDay2}</dt>
        {#if shop.dutyDaytime2 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime2}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay3 != null}
        <dt>{shop.dutyDay3}</dt>
        {#if shop.dutyDaytime3 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime3}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay4 != null}
        <dt>{shop.dutyDay4}</dt>
        {#if shop.dutyDaytime4 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime4}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay5 != null}
        <dt>{shop.dutyDay5}</dt>
        {#if shop.dutyDaytime5 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime5}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay6 != null}
        <dt>{shop.dutyDay6}</dt>
        {#if shop.dutyDaytime6 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime6}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay7 != null}
        <dt>{shop.dutyDay7}</dt>
        {#if shop.dutyDaytime7 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime7}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay8 != null}
        <dt>{shop.dutyDay8}</dt>
        {#if shop.dutyDaytime8 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime8}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay9 != null}
        <dt>{shop.dutyDay9}</dt>
        {#if shop.dutyDaytime9 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime9}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay10 != null}
        <dt>{shop.dutyDay10}</dt>
        {#if shop.dutyDaytime10 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime10}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay11 != null}
        <dt>{shop.dutyDay11}</dt>
        {#if shop.dutyDaytime11 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime11}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay12 != null}
        <dt>{shop.dutyDay12}</dt>
        {#if shop.dutyDaytime12 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime12}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay13 != null}
        <dt>{shop.dutyDay13}</dt>
        {#if shop.dutyDaytime13 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime13}</dd>
        {/if}
      {/if}
    </dl>
    <dl>
      {#if shop.dutyDay14 != null}
        <dt>{shop.dutyDay14}</dt>
        {#if shop.dutyDaytime14 == null}
          <dd>휴무</dd>
        {:else}
          <dd>{shop.dutyDaytime14}</dd>
        {/if}
      {/if}
    </dl>
  </div>

  <h3>전화번호</h3>
  <div class="box_1">
    {shop.dutyTel1}
    <div class="ar">
      <button type="button" class="mbtn_n_1" on:click={getCall(shop.dutyTel1)}>전화하기</button>
    </div>
    <!-- <a href={call} class="ar">
          <button type="button" class="mbtn_n_1" data-url="tel:02-000-0000">전화하기</button>
        </a> -->
  </div>

  <!-- <h3>보유장비</h3>
    <div class="box_1">혈압기, 안마기</div> -->

  <h3>위치정보</h3>
  <div class="box_1">
    <p class="text1">
      {shop.dutyAddr}
    </p>
    <div class="map_wrap">
      <div id="map" />
      <button
        type="button"
        class="mbtn_t_2b"
        on:click={() => {
          goMap("https://map.kakao.com/link/map/" + shop.dutyName + "," + lat + "," + lon);
        }}
      >
        지도보기
      </button>
    </div>
  </div>
</section>
