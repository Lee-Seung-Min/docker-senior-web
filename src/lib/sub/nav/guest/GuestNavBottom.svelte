<script>
  // @ts-nocheck
  import {goto} from "$app/navigation";
  import {getOsType} from "$lib/js/phoneAction.js";

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
<section>
    <header>
        <nav>
            <button class="nav" on:click={() => gotoDownloadLink()}>
                <img src="/lib/img/nav/nav_banner05.png">
            </button>
        </nav>
    </header>
</section>

<style>
    .nav {
        width: 100%;
        margin: 0;
        /*background-color: #FFFFFF;*/
        background-color: #17469c;
    }

    .nav::before {
        display: none;
    }

    .nav img {
        /*width: 100%;*/
        height: 100%;
    }
</style>