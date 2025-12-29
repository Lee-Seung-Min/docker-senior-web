<script>
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { onMount } from "svelte";

  onMount(() => {
    goto(urlList.uaLogin);
  });
</script>
