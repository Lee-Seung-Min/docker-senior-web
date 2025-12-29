<script>
  // @ts-nocheck
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { urlList } from "$lib/urlList";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  let iosLink = "barodoctorios://return";
  let popUp = false;
  onMount(() => {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      popUp = true;
    } else {
      goto(urlList.uaHome);
    }
  });
</script>

<Nav>화상진료</Nav>

<PopUp {popUp}>
  <slot>
    <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={() => goto(iosLink)}>
      바로닥터 어플로 돌아가기
    </button>
  </slot>
</PopUp>
