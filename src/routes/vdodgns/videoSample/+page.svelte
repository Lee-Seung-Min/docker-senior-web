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
  let dgnsId;
  let stream;
  let client;
  let devices;
  onMount(async () => {
    dgnsId = $page.url.searchParams.get("dgnsId");
    const url = /*urlAddr + "8083*/ authUrlAddr + "/v1/zoom/getToken?dgnsId=" + dgnsId;
    let resData = await getAPI(url);
    console.log(resData);
    const memurl = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/dgns/selectDgnsWtInfo?dgnsId=" + dgnsId;
    let memData = await getAPI(memurl);
    console.log(memData);
    const ZoomVideo = window.WebVideoSDK.default;
    client = ZoomVideo.createClient();
    let token = resData.resultVO;
    let pw;
    client.init("ko-KO", "CDN");
    client.join("비대면진료" + dgnsId, token, memData.resultVO.dgnsPatName, pw).then(async () => {
      stream = client.getMediaStream();
      stream.subscribeVideoStatisticData({ detailed: true });
      streamVideo();
    });

    client.on("video-statistic-data-change", (payload) => {
      console.log(payload);
    });
    client.on("peer-video-state-change", (payload) => {
      if (payload.action === "Start") {
        stream.renderVideo(document.querySelector("#participant-videos-canvas"), payload.userId, 1280, 720, 0, 0, 3);
      } else if (payload.action === "Stop") {
        stream.stopRenderVideo(document.querySelector("#participant-videos-canvas"), payload.userId);
      }
    });
  });

  function streamVideo() {
    // if Desktop Chrome, Edge, and Firefox with SharedArrayBuffer not enabled, Android browsers, and on devices with less than 4 logical processors available
    if (stream.isRenderSelfViewWithVideoElement()) {
      // start video - video will render automatically on HTML Video element
      stream
        .startVideo({ videoElement: document.querySelector("#my-self-view-video"), hd: true, originalRatio: true })
        .then(() => {
          // show HTML Video element in DOM
          document.querySelector("#my-self-view-video").style.display = "block";
        })
        .catch((error) => {
          console.log(error);
        });
      // desktop Chrome, Edge, and Firefox with SharedArrayBuffer enabled, and all other browsers
    } else {
      // start video
      stream
        .startVideo({ hd: true, originalRatio: true })
        .then(() => {
          // render video on HTML Canvas element
          stream
            .renderVideo(
              document.querySelector("#my-self-view-canvas"),
              client.getCurrentUserInfo().userId,
              1280,
              720,
              0,
              0,
              3
            )
            .then(() => {
              // show HTML Canvas element in DOM
              document.querySelector("#my-self-view-canvas").style.display = "block";
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
</script>

<section id="tel_wrap">
  <div id="tel">
    <!-- <div class="Screen">
        <div>
          <div class="big"> -->
    <!-- svelte-ignore a11y-media-has-caption -->
    <!-- <video bind:this={remoteVideo} controls autoplay playsinline /> -->

    <!-- </div>
          <div class="samll"> -->
    <!-- svelte-ignore a11y-media-has-caption -->
    <!-- <video bind:this={localVideo} controls autoplay playsinline id="myvideore" /> -->
    <!-- </div>
        </div>
      </div> -->
    <canvas id="participant-videos-canvas" height="1080" width="1920" />
    <video id="my-self-view-video" playsinline />
    <canvas id="my-self-view-canvas" height="1080" width="1920" />
  </div>
</section>
