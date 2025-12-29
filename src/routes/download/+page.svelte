<script>
  // @ts-ignore
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  // @ts-ignore
  import { urlList } from "$lib/urlList";
  import { onMount } from "svelte";

  onMount(() => {
    launchApp();
  });
  function launchApp() {
    let shpId = $page.url.searchParams.get("qrShpId");
    if (/Android/i.test(navigator.userAgent)) {
      // Android 장치
      // 앱이 설치되어 있으면 URL 스킴을 호출
      setTimeout(function () {
        // @ts-ignore
        if (shpId != null && shpId != "null" && shpId != 0) {
          goto("barodoctorsam://www.barodoctor.com/hspt/uaHptDtl?shpId=" + shpId + "&shpType=shp&qrType=true");
          // goto("barodoctorsam://122.199.232.133:5173/hspt/uaFavHsptLst?qrShpId=" + shpId);
        } else {
          goto("barodoctorsam://www.barodoctor.com/");
        }
      }, 0);
      setTimeout(function () {
        // 앱이 설치되어 있지 않으면 Google Play Store로 이동
        window.location.href = "https://play.google.com/store/apps/details?id=com.bit.baro_doctor_android";
      }, 500);
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // iOS 장치
      setTimeout(function () {
        // @ts-ignore
        if (shpId != null && shpId != "null" && shpId != 0) {
          // 앱이 설치되어 있으면 URL 스킴을 호출
          goto("barodoctorios://www.barodoctor.com/hspt/uaHptDtl?shpId=" + shpId + "&shpType=shp&qrType=true");
        } else {
          goto("barodoctorios://www.barodoctor.com/");
        }
      }, 0);
      setTimeout(function () {
        // 앱이 설치되어 있지 않으면 App Store로 이동
        if (document.visibilityState === "visible") {
          window.location.href = "https://apps.apple.com/kr/app/%EB%B0%94%EB%A1%9C%EB%8B%A5%ED%84%B0/id6471040305";
        }
      }, 5000);
    }
  }
</script>
