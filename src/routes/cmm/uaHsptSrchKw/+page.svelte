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
  import { searchType, searchData, searchWhat } from "$lib/store/search";
  let isSearchAllowed = false;
  onMount(() => {
    $footCheck = "";
    $searchType = "K";
    $searchData = "";
  });
</script>

<SearchNav {isSearchAllowed} />
<section class="contents">
  <h3>진료 과목</h3>
  <div class="btn_list">
    <!-- 등록된 이미지 불러오기(이미지 사이즈 80*80) -->
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "가정의학과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_04.png", import.meta.url).href} class="img" alt="." />가정의학과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "마취통증의학과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_01.png", import.meta.url).href} class="img" alt="." />마취통증<br
        />의학과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "비뇨의학과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_02.png", import.meta.url).href} class="img" alt="." />비뇨의학과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "성형외과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_03.png", import.meta.url).href} class="img" alt="." />성형외과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "신경과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_05.png", import.meta.url).href} class="img" alt="." />신경과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "신경외과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_06.png", import.meta.url).href} class="img" alt="." />신경외과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "안과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_dep_07.png", import.meta.url).href} class="img" alt="." />안과</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "영상의학과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_08.png", import.meta.url).href} class="img" alt="." />영상의학과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "외과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_dep_09.png", import.meta.url).href} class="img" alt="." />외과</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "응급의학과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_10.png", import.meta.url).href} class="img" alt="." />응급의학과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "재활의학과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_11.png", import.meta.url).href} class="img" alt="." />재활의학과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "정신건강의학과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_12.png", import.meta.url).href} class="img" alt="." />정신건강<br
        />의학과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "정형외과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_13.png", import.meta.url).href} class="img" alt="." />정형외과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "치과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_dep_14.png", import.meta.url).href} class="img" alt="." />치과</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "산부인과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_15.png", import.meta.url).href} class="img" alt="." />산부인과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "한의원";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_16.png", import.meta.url).href} class="img" alt="." />한의원
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "이비인후과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_17.png", import.meta.url).href} class="img" alt="." />이비인후과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "피부과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_18.png", import.meta.url).href} class="img" alt="." />피부과
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "내과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_dep_19.png", import.meta.url).href} class="img" alt="." />내과</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "D";
        $searchData = "소아청소년과";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_20.png", import.meta.url).href} class="img" alt="." />소아청소년과
      </div>
    </button>
  </div>

  <h3>증상 별</h3>
  <div class="btn_list">
    <!-- 등록된 이미지 불러오기(이미지 사이즈 80*80) -->
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "코로나치료";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_01.png", import.meta.url).href} class="img" alt="." />코로나치료
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "감기";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_care_02.png", import.meta.url).href} class="img" alt="." />감기</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "고열";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_care_03.png", import.meta.url).href} class="img" alt="." />고열</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "피부질환";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_04.png", import.meta.url).href} class="img" alt="." />피부질환
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "고혈압";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_05.png", import.meta.url).href} class="img" alt="." />고혈압
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "당뇨";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_care_06.png", import.meta.url).href} class="img" alt="." />당뇨</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "장염";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_care_07.png", import.meta.url).href} class="img" alt="." />장염</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "복통";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_care_08.png", import.meta.url).href} class="img" alt="." />복통</div>
    </button>

    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "위염";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_care_09.png", import.meta.url).href} class="img" alt="." />위염</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "탈모";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_care_10.png", import.meta.url).href} class="img" alt="." />탈모</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "무좀";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_care_11.png", import.meta.url).href} class="img" alt="." />무좀</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "여성질환";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_12.png", import.meta.url).href} class="img" alt="." />여성질환
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "비염";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_care_13.png", import.meta.url).href} class="img" alt="." />비염</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "안구건조";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_14.png", import.meta.url).href} class="img" alt="." />안구건조
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "통증";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div><img src={new URL("/src/assets/img/icon_care_15.png", import.meta.url).href} class="img" alt="." />통증</div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "방광염";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_16.png", import.meta.url).href} class="img" alt="." />방광염
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "사후피임";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_17.png", import.meta.url).href} class="img" alt="." />사후피임
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "정신건강";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_18.png", import.meta.url).href} class="img" alt="." />정신건강
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "다이어트";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_19.png", import.meta.url).href} class="img" alt="." />다이어트
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "만성질환";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_20.png", import.meta.url).href} class="img" alt="." />만성질환
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "여드름";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_care_21.png", import.meta.url).href} class="img" alt="." />여드름
      </div>
    </button>
    <button
      type="button"
      on:click={() => {
        $searchWhat = "I";
        $searchData = "치아";
        goto(urlList.searchHsptView);
      }}
      class="box_btn"
    >
      <div>
        <img src={new URL("/src/assets/img/icon_dep_14.png", import.meta.url).href} class="img" alt="." />치아
      </div>
    </button>
  </div>
</section>
