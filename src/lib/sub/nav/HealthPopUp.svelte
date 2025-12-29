<script>
  export let sectionClass = "z_alert";
  export let popUp = false;
</script>

<!--hlthinfo 페이지 팝업-->
{#if popUp}
  <section class={sectionClass}>
    <div class="bg" />
    <div class="box_1">
      <slot />
      <br />
      <slot name="btns" />
      <slot name="btns_h" />
    </div>
  </section>
{/if}
