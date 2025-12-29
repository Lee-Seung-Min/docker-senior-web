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

  //병명 리스트. 추후 자주 검색되는 병명 리스트를 가져오는 것이 개발되면 그것을 넣는다.
  const illList = [
    { illName: "감기" },
    { illName: "코로나" },
    { illName: "우울증" },
    { illName: "비염" },
    { illName: "탈모" },
    { illName: "위염" },
    { illName: "건선" },
  ];

  onMount(() => {
    $footCheck = "";
    $searchType = "K";
    $searchData = "";
  });

  function clickSearchBox(text) {
    $searchData = text;
    $searchWhat = "A";
    goto(urlList.searchHsptView);
  }
</script>

<SearchNav {isSearchAllowed} />
<section class="contents">
  <h3>많이 검색된 질병</h3>
  <div style="display: flex; flex-wrap:wrap">
    {#each illList as ill, idx}
      <button class="searchBox" on:click={() => clickSearchBox(ill.illName)}>{ill.illName}</button>
    {/each}
  </div>
</section>

<style>
  .searchBox {
    width: max-content;
    padding: 8px 10px;
    margin-right: 10px;
    margin-bottom: 8px;
    background-color: #d3d3d3;
    border: 0px;
    border-radius: 10%;
  }
</style>
