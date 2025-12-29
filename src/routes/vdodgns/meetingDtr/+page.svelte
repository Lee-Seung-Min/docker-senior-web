<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import { page } from "$app/stores";
  import { footCheck } from "$lib/store/navStore.js";
  import { authUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { meeting_key } from "$lib/js/Env";
  let dgnsId;
  let signature;
  let code;
  let password;
  let zakToken;
  let dtrName;
  let mn;
  let width;
  let height;
  onMount(async () => {
    dgnsId = $page.url.searchParams.get("dgnsId");
    code = $page.url.searchParams.get("code");
    await setAspectRatio();
    await initializeZoomSDK();
  });

  // Zoom Web SDK 로드 후 초기화하는 함수
  async function initializeZoomSDK() {
    try {
      console.log(width + " " + height);
      // Zoom Web SDK 의존성 스크립트들을 순차적으로 로드합니다.
      await loadScript("https://source.zoom.us/2.14.0/lib/vendor/react.min.js");
      await loadScript("https://source.zoom.us/2.14.0/lib/vendor/react-dom.min.js");
      await loadScript("https://source.zoom.us/2.14.0/lib/vendor/redux.min.js");
      await loadScript("https://source.zoom.us/2.14.0/lib/vendor/redux-thunk.min.js");
      await loadScript("https://source.zoom.us/2.14.0/lib/vendor/lodash.min.js");
      await loadScript("https://source.zoom.us/zoom-meeting-embedded-2.14.0.min.js");
      const memurl = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/dgns/selectDgnsWtInfo?dgnsId=" + dgnsId;
      let memData = await getAPI(memurl);
      dtrName = memData.resultVO.dgnsDtrName;
      console.log(memData);
      const dtrUrl = /*urlAddr + "8083*/ authUrlAddr + "/v1/zoom/zakToken?code=" + code + "&dgnsId=" + dgnsId;
      let meetData = await getAPI(dtrUrl);
      console.log(meetData);
      password = dgnsId;
      signature = meetData.resultVO.signature;
      console.log(signature);
      zakToken = meetData.resultVO.zak.zakToken;
      mn = meetData.resultVO.mn;
      //clientView
      // await loadScript("https://source.zoom.us/2.14.0/css/bootstrap.css");
      // await loadScript("https://source.zoom.us/2.14.0/css/react-select.css");

      // ZoomMtg.setZoomJSLib("https://source.zoom.us/2.14.0/lib", "/av");
      // // loads WebAssembly assets
      // ZoomMtg.preLoadWasm();
      // ZoomMtg.prepareWebSDK();
      // // loads language files, also passes any error messages to the ui
      // ZoomMtg.i18n.load("ko-KO");
      // ZoomMtg.i18n.reload("ko-KO");

      //componet view
      // ZoomMtgEmbedded 객체를 사용하여 Zoom Web SDK를 초기화합니다.
      const client = ZoomMtgEmbedded.createClient();

      let meetingSDKElement = document.getElementById("meetingSDKElement");

      client.init({
        zoomAppRoot: meetingSDKElement,
        language: "ko-KO",
        customize: {
          video: {
            isResizable: true,
            defaultViewType: "active",
            viewSizes: {
              default: {
                height: height,
                width: width,
              },
            },
          },
        },
      });

      client.join({
        sdkKey: meeting_key,
        signature: signature, // role in SDK signature needs to be 1
        meetingNumber: mn,
        password: password,
        userName: dtrName,
        zak: zakToken, // the host's zak token
      });
      // client view
      // ZoomMtg.init({
      //   leaveUrl: "https://localhost:5173/home/uaHome", // https://example.com/thanks-for-joining
      //   success: (success) => {
      //     ZoomMtg.join({
      //       sdkKey: "h8l9qAdFTz6F_KZejT7wA",
      //       signature: signature, // role in SDK signature needs to be 1
      //       meetingNumber: mn,
      //       passWord: password,
      //       userName: dtrName,
      //       zak: zakToken, // the host's ZAK token
      //       success: (success) => {
      //         console.log(success);
      //       },
      //       error: (error) => {
      //         console.log(error);
      //       },
      //     });
      //   },
      //   error: (error) => {
      //     console.log(error);
      //   },
      // });
    } catch (error) {
      console.error("Zoom Web SDK 로드 또는 초기화 중 오류 발생:", error);
    }
  }

  // 스크립트를 동적으로 로드하는 함수
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  async function setAspectRatio() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    width = screenWidth;
    height = screenHeight - 80 - 34 - 42;
    if (width >= height) {
      const targetAspectRatio = 16 / 9;
      // 화면 비율 조정
      if (screenWidth / height > targetAspectRatio) {
        width = height * targetAspectRatio;
      } else {
        height = screenWidth / targetAspectRatio;
      }
    }
  }
</script>

<!--component view-->

<div id="meetingSDKElement">
  <!-- Meeting SDK renders here when a user starts or joins a Zoom meeting -->
</div>

<!--clientView-->
<!-- added on import -->
<!-- <div id="zmmtg-root" />
<div id="aria-notify-area" /> -->
<!-- added on meeting init -->
<!-- <div class="ReactModalPortal" />
<div class="ReactModalPortal" />
<div class="ReactModalPortal" />
<div class="ReactModalPortal" />
<div class="global-pop-up-box" />
<div class="sharer-controlbar-container sharer-controlbar-container--hidden" /> -->
