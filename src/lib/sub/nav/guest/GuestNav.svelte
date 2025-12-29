<script>
  // @ts-nocheck
  import {goto} from "$app/navigation";
  import {getOsType} from "$lib/js/phoneAction.js";

  export let sectionClass = "location";
  export let title;

  function gotoDownloadLink() {
    const device = getOsType();
    if (device == "android") {
      goto("https://play.google.com/store/apps/details?id=com.bit.baro_doctor_android")
    } else if (device == "ios") {
      goto("https://apps.apple.com/kr/app/%EB%B0%94%EB%A1%9C%EB%8B%A5%ED%84%B0/id6471040305")
    } else {
      goto("https://play.google.com/store/apps/details?id=com.bit.baro_doctor_android")
    }
  }
</script>

<!--상단 바 Nav 부분-->
<section class={sectionClass}>
    <div>
        <h2>
            <button type="button" class="guest-logo" title="뒤로가기" on:click={() => gotoDownloadLink()}><img
                    style="width: 100%" src="/lib/img/nav/nav_logo.png"></button>
            {title}
        </h2>
    </div>
</section>

<style>
    .guest-logo {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 10px;
        margin: auto;
        padding: 5px;
        width: 50px;
        height: 50px;
        background-size: 100%;
        z-index: 11
    }
    .guest-logo img {
        border-radius: 5px;
    }
</style>