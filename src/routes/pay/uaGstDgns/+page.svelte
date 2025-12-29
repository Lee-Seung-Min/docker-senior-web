<!--  비회원 진료 결제  -->
<script>
  // @ts-nocheck

  import PayDgns from "$lib/sub/pay/PayDgns.svelte";
  import GuestNav from "$lib/sub/nav/guest/GuestNav.svelte";
  import {page} from "$app/stores";
  import {makeStr} from "$lib/js/makeStr.js";
  import {adminUrlAddr} from "$lib/js/urlAddr.js";
  import {getAPI} from "$lib/js/getAPI.js";
  import {onMount} from "svelte";

  const userType = "guest";
  let dgnsId;

  onMount(async () => {
    setInitToken()
    await getDgnsIdByToken();
  })

  async function getDgnsIdByToken() {
    const jsonStr = makeStr({ds: "s"});
    const url = adminUrlAddr + "/v1/mpay/selectGstDgnsInfo";
    await getAPI(url, jsonStr)
      .then((res) => {
        dgnsId = res.resultVO;
      })
      .catch((err) => {
          throw err;
      })
  }

  function setInitToken() {
    const userJwt = $page.url.searchParams.get("guest");
    const defaultRefreshJwt = "guest"
    localStorage.setItem("userJwt", userJwt);
    localStorage.setItem("refreshJwt", defaultRefreshJwt);
  }

</script>

<section>
    <GuestNav title="병원 결제"></GuestNav>
    {#if dgnsId}
        <PayDgns {userType} {dgnsId}></PayDgns>
    {/if}
</section>