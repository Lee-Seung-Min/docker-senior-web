<script>
  // @ts-nocheck

  export let sectionClass = "location";
</script>

<!--상단 바 Nav 부분-->
<!-- content S -->
<section class={sectionClass}>
  <div>
    <h2>
      <slot />
      <button type="button" title="뒤로가기" onclick="history.back();" class="back" />
    </h2>
    <slot name="btns" />
  </div>
</section>
