<script>
  export let sectionClass = "z_alert";
  export let popUp = false;
</script>

<!--팝업 창-->
{#if popUp}
  <section class={sectionClass}>
    <div class="bg" />
    <div class="box_1">
      <p class="tex" style="padding: 10px 0 20px 0"><slot /></p>
      <slot name="btns" />
    </div>
  </section>
{/if}
