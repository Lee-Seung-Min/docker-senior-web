<script>
  // @ts-nocheck

  import { urlList } from "$lib/urlList";
  import { goto } from "$app/navigation";
  import { footCheck } from "$lib/store/navStore.js";
  import { onMount } from "svelte";
  import { isLogin } from "$lib/store/loginStore";
  import "$lib/css/common.css";
  import "$lib/css/reset.css";
  import "$lib/font/XEIcon/xeicon.min.css";
  import "$lib/font/pretendard.css";
  import "$lib/css/jquery-ui.css";
  import "$lib/css/vdoDgns.css";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import { page } from "$app/stores";
  let popUp = false;
  function xButton() {
    popUp = false;
  }
  const pathsToCheck = ["/pay/uaGst", "/error"];
  const isMobileNav = pathsToCheck.some((path) => $page.url.pathname.startsWith(path));
</script>

<svelte:head>
  <script src="/lib/js/jquery-3.3.1.min.js"></script>
  <script src="/lib/js/jquery-ui.js"></script>
  <script src="/lib/js/jquery.bxslider.min.js"></script>
  <script src="/lib/js/common.js"></script>
</svelte:head>

{#if isMobileNav}
  <slot />
{:else}
  <!-- 로그인 했을 때 body에 login 클래스 추가 -->
  <body class="login menu1">
    <header>
      <div id="skipNavi">
        <a href="#left_wrap">전체메뉴 바로가기</a>
        <a href="#content">본문바로가기</a>
      </div>
      <!--
    <div class="info">
      <button class="search" type="button">
        <div />
        <p title="검색" />
      </button>
    </div>
    -->
      {#if $isLogin}
        <nav>
          <!-- 각 페이지로 이동시 on 클래스 추가-->
          <button
            type="button"
            class={$footCheck == "home" ? "home on" : "home"}
            on:click={() => {
              $footCheck = "home";
              goto(urlList.uaHome);
            }}
            >홈
          </button>
          <button
            type="button"
            class={$footCheck == "menu1" ? "menu1 on" : "menu1"}
            on:click={() => {
              $footCheck = "menu1";
              goto(urlList.uaDgnsLst);
            }}
            >진료
          </button>
          <!--이동 가능 버튼-->
          <button
            type="button"
            class={$footCheck == "menu2" ? "menu2 on" : "menu2"}
            on:click={() => {
              $footCheck = "menu2";
              goto(urlList.uaPspnLst);
            }}>처방</button
          >
          <!--처방 서비스 오픈전-->
          <!-- <button
          type="button"
          class="menu2"
          on:click={() => {
            popUp = true;
          }}>처방</button
        > -->
          <button
            type="button"
            class={$footCheck == "menu3" ? "menu3 on" : "menu3"}
            on:click={() => {
              $footCheck = "menu3";
              goto(urlList.uaMbrHlthLst);
            }}>건강관리</button
          >
          <button
            type="button"
            class={$footCheck == "menu4" ? "menu4 on" : "menu4"}
            on:click={() => {
              $footCheck = "menu4";
              goto(urlList.uaSetting);
            }}
            >설정
          </button>
        </nav>
      {/if}
    </header>

    <slot />
  </body>
  <PopUp {popUp}>
    서비스 준비중입니다.
    <button type="button" class="alert_close" on:click={xButton}>
      <i class="xi-close-min" />
    </button>
    <p class="btn_wrap" id="btn" slot="btns">
      <button type="button" class="mbtn_n_4" id="close" on:click={xButton}>확인</button>
    </p>
  </PopUp>
{/if}
