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
  let notiList = [];
  let ntcId;
  let ntcType;
  onMount(async () => {
    $footCheck = "";
    ntcId = $page.url.searchParams.get("ntcId");
    ntcType = $page.url.searchParams.get("ntcType");

    if (ntcType == "admin") {
      const url = adminUrlAddr + "/v1/basicinfo/selectMobileAdmNotice?ntcId=" + ntcId;
      let resData = await getAPI(url);
      notiList = resData.resultVO;
      ntcType = "바로닥터";
    } else {
      const url = adminUrlAddr + "/v1/basicinfo/selectMobileShpNotice?ntcId=" + ntcId;
      let resData = await getAPI(url);
      notiList = resData.resultVO;
    }
  });
</script>

<!-- content S -->
<section class="location">
  <div>
    <h2>
      공지사항
      <button type="button" title="뒤로가기" onclick="history.back();" class="back" />
    </h2>
  </div>
</section>
<section class="contents">
  <div class="box_1">
    <p class="tit">{notiList.ntcTitl}</p>
    <p class="data" style="color: black;">
      <!-- {ntcType} -->
       남원 E-케어
    </p>
    <p class="data">{notiList.ntcFrom}</p>
    <div class="editor">
      {notiList.ntcCnts}
    </div>
  </div>

  <dev class="btn_wrap inline">
    <button
      type="button"
      class="btn_04 small"
      on:click={() => {
        goto(urlList.uaNtctLst);
      }}>목록</button
    >
  </dev>
  <!-- <div class="btn_wrap inline">
    <button
      type="button"
      class="btn_04 small"
      on:click={() => {
        goto(urlList.uaNtcDtl);
      }}>이전글</button
    >
    <button
      type="button"
      class="btn_04 small"
      on:click={() => {
        goto(urlList.uaNtcDtl);
      }}>다음글</button
    >
  </div> -->
</section>
