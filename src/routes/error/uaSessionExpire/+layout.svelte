<script>
  // @ts-nocheck

  import GuestNav from "$lib/sub/nav/guest/GuestNav.svelte";
  import GuestNavBottom from "$lib/sub/nav/guest/GuestNavBottom.svelte";

  export let page;
</script>

<svelte:head>
    <script src="/lib/js/jquery-3.3.1.min.js"></script>
    <script src="/lib/js/jquery-ui.js"></script>
    <script src="/lib/js/jquery.bxslider.min.js"></script>
    <script src="/lib/js/common.js"></script>
</svelte:head>

<body>
<header>
    <GuestNav title="바로 닥터"></GuestNav>
    <GuestNavBottom/>
</header>
<slot/>
</body>

<style>
</style>