<script>
  // @ts-nocheck

  import {goto} from "$app/navigation";
  import {urlList} from "$lib/urlList.js";
  import GuestNavBottom from "$lib/sub/nav/guest/GuestNavBottom.svelte";

  export let page;
</script>

<svelte:head>
  <script src="/lib/js/jquery-3.3.1.min.js"></script>
  <script src="/lib/js/jquery-ui.js"></script>
  <script src="/lib/js/jquery.bxslider.min.js"></script>
  <script src="/lib/js/common.js"></script>
</svelte:head>
<body class="login menu1">
<GuestNavBottom/>
<slot />
</body>
