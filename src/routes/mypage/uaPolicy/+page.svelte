<script>
  import { goto } from "$app/navigation";
  import Nav from "$lib/sub/nav/Nav.svelte";
    import { urlList } from "$lib/urlList";
</script>

<Nav>약관 및 정책</Nav>
<section class="contents">
  <div class="list_box">
    <button
      type="button"
      class="box_2"
      id="show_reg"
      on:click={() => goto(urlList.serviceTerms)}
      >서비스 이용약관
    </button>
    <button
      type="button"
      class="box_2"
      id="show_reg"
      on:click={() => goto(urlList.privacyTerms)}
      >개인정보 처리방침
    </button>
    <button
      type="button"
      class="box_2"
      id="show_reg"
      on:click={() => goto(urlList.locationTerms)}
      >위치기반 서비스 이용약관
    </button>
  </div>
</section>
