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
  import { footCheck } from "$lib/store/navStore.js";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { getNew } from "$lib/js/dateFunction";
  let notiList = [];
  let page = 0;
  let sentinel;
  let observer;
  let noMore = false;
  onMount(async () => {
    $footCheck = "";
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          let mbrId = result;
          await search();
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
  });
  async function search() {
    page = 0;
    noMore = true;
    const url = /*urlAddr + "8081*/ adminUrlAddr + "/v1/basicinfo/uaNtctLst?page=" + page;
    let resData = await getAPI(url);
    notiList = resData.resultVO;
    noMore = false;
  }
  async function loadMoreData() {
    page += 1;
    const url = /*urlAddr + "8081*/ adminUrlAddr + "/v1/basicinfo/uaNtctLst?page=" + page;
    let resData = await getAPI(url);
    let newData = resData.resultVO;
    if (newData.length == 0) {
      noMore = true;
    }
    notiList = [...notiList, ...newData];
  }
</script>

<Nav>공지사항</Nav>
<section class="contents">
  <div class="list_box notice_list" id="noti">
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
          {#if getNew(noti.ntcFrom)}<span class="new" />{/if}
        </p>
        <p class="data">
          {#if noti.ntcType == "admin"}
            남원 E-케어
          {:else}
            {noti.ntcType}
          {/if}
          {noti.ntcFrom.substring(2)}
        </p>
      </button>
    {/each}
  </div>
  <div bind:this={sentinel} />
</section>
