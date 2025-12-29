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

  onMount(async () => {});
</script>

<Nav>처방전 접수</Nav>
<section class="contents">
  <h3 class="big">
    약국 선택을 완료 하였습니다.
    <br />약 수령 방법을 선택해주세요.
  </h3>
  <div class="btn_wrap">
    <div>
      <button
        class="box_pre_1"
        on:click={() => {
          goto(urlList.uaVstGet);
        }}
      >
        본인수령
      </button>
      <button
        class="box_pre_1"
        on:click={() => {
          goto(urlList.uaVstGet2);
        }}
      >
        대리인수령
      </button>
    </div>
  </div>
</section>
