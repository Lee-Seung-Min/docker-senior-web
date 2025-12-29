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
  import state from "../uaVdoDgns/simple-state";
  let remoteVideo;
  let localVideo;
  let dgnsId;
  let stream;
  let videoWidth;
  let videoHeight;
  let mainThreadCanvasPeer;
  let mainThreadCanvasSelf;
  let mainThreadContextPeer;
  let mainThreadContextSelf;
  let videoOn = false;
  let audioOn = true;
  let checkLeave = false;
  let client;
  let devices;
  onMount(async () => {
    dgnsId = $page.url.searchParams.get("dgnsId");
    await setAspectRatio().then();
    // 윈도우 크기가 변경될 때 화면 비율 조정
    window.addEventListener("resize", handleResize);
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
    const clientSideTelemetry = client.getLoggerClient();
    client
      .join("비대면진료" + dgnsId, token, "의사?", pw)
      .then(async () => {
        stream = client.getMediaStream();
        stream.subscribeVideoStatisticData({ detailed: true });

        initClientEventListeners(client, stream);
        videoCheck();
        stream.startAudio().then(document.querySelector("#micButton").classList.toggle("meeting-control-button__off"));
        client.getAllUser().forEach((user) => {
          if (user.bVideoOn) {
            stream.renderVideo(
              document.querySelector("#participant-videos-canvas"),
              peerParticipants[0].userId,
              videoWidth,
              videoHeight,
              0,
              0,
              3
            );
          }
        });
        console.log(stream.isSupportHDVideo());
        try {
          devices = await ZoomVideo.getDevices();
          console.log(devices);
        } catch (e) {
          console.log(devices);
          console.log("get devices error!", e);
        }
      })
      .catch((error) => {
        console.log(error);
      });
    client.on("peer-video-state-change", (payload) => {
      if (payload.action === "Start") {
        stream.renderVideo(document.querySelector("#participant-videos-canvas"), payload.userId, 1920, 1080, 0, 0, 3);
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
          document.querySelector("#videoButton").classList.toggle("meeting-control-button__off");
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
              videoWidth,
              videoHeight,
              0,
              0,
              3
            )
            .then(() => {
              // show HTML Canvas element in DOM
              document.querySelector("#my-self-view-canvas").style.display = "block";
              document.querySelector("#videoButton").classList.toggle("meeting-control-button__off");
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

  function stopStream() {
    console.log(devices);
    if (devices != undefined && devices != "") {
      stream.stopVideo();

      if (!stream.isRenderSelfViewWithVideoElement()) {
        document.querySelector("#my-self-view-canvas").style.display = "none";
        document.querySelector("#videoButton").classList.toggle("meeting-control-button__off");
      } else {
        document.querySelector("#my-self-view-video").style.display = "none";
        document.querySelector("#videoButton").classList.toggle("meeting-control-button__off");
      }
    }

    if (checkLeave) {
      client.leave();
      goto(urlList.uaHome);
    }
  }

  const PARTICIPANT_CHANGE_TYPE = {
    ADD: "add",
    REMOVE: "remove",
    UPDATE: "update",
  };

  const PEER_VIDEO_STATE_CHANGE_ACTION_TYPE = {
    Start: "Start",
    Stop: "Stop",
  };

  const onUserAddedListener = (client) => {
    client.on("user-added", (payload) => {
      console.log(`User added`, payload);

      state.participants = client.getAllUser();
    });
  };

  const onUserRemovedListener = (client) => {
    client.on("user-removed", (payload) => {
      console.log(`User removed`, payload);

      state.participants = client.getAllUser();
    });
  };

  const onUserUpdatedListener = (client) => {
    client.on("user-updated", (payload) => {
      console.log(`User updated`, payload);

      state.participants = client.getAllUser();
    });
  };

  const onPeerVideoStateChangedListener = (client, stream) => {
    client.on("peer-video-state-change", async (payload) => {
      console.log("onPeerVideoStateChange", payload);
      const { action, userId } = payload;

      if (state.participants.findIndex((user) => user.userId === userId) === -1) {
        console.log("Detected unrecognized participant ID. Ignoring: ", userId);
        return;
      }

      if (action === PEER_VIDEO_STATE_CHANGE_ACTION_TYPE.Start) {
        await stream.renderVideo(
          document.querySelector("#participant-videos-canvas"),
          payload.userId,
          videoWidth,
          videoHeight,
          0,
          0,
          3
        );
      } else if (action === PEER_VIDEO_STATE_CHANGE_ACTION_TYPE.Stop) {
        await stream.stopRenderVideo(document.querySelector("#participant-videos-canvas"), payload.userId);
      }
    });
    client.on("video-statistic-data-change", (payload) => {
      console.log(payload);
      clientSideTelemetry.reportToGlobalTracing();
    });
  };

  const onMediaWorkerReadyListener = (client) => {
    client.on("media-sdk-change", (payload) => {
      const { action, type, result } = payload;
      if (type === "audio" && result === "success") {
        if (action === "encode") {
          state.audioEncode = true;
        } else if (action === "decode") {
          state.audioDecode = true;
        }
      }
    });
  };
  const whoSpeak = () => {
    client.on("active-speaker", (payload) => {
      console.log("Active speaker", payload);
    });
  };
  const initClientEventListeners = (client, stream) => {
    onUserAddedListener(client);
    onUserRemovedListener(client, stream);
    onUserUpdatedListener(client);
    onPeerVideoStateChangedListener(client, stream);
    onMediaWorkerReadyListener(client);
    whoSpeak();
    // The started video before join the session
    setTimeout(() => {
      const peerParticipants = state.participants.filter((user) => user.userId !== state.selfId);
      console.log(peerParticipants);
      if (peerParticipants.length > 0 && peerParticipants[0].bVideoOn === true) {
        stream.renderVideo(
          document.querySelector("#participant-videos-canvas"),
          peerParticipants[0].userId,
          videoWidth,
          videoHeight,
          0,
          0,
          3
        );
      }
    }, 3000);
  };

  async function setAspectRatio() {
    const videoElement = document.querySelector("#my-self-view-video");
    const canvasElement = document.querySelector("#my-self-view-canvas");
    const peerCanvasElement = document.querySelector("#participant-videos-canvas");
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    // const screenWidthPx = screenWidth - 48;
    // 원하는 비율 (예: 16:9)
    const targetAspectRatio = 16 / 9;

    videoWidth = screenWidth;
    videoHeight = screenHeight;

    // 화면 비율 조정
    if (screenWidth / screenHeight > targetAspectRatio) {
      videoWidth = screenHeight * targetAspectRatio;
    } else {
      videoHeight = screenWidth / targetAspectRatio;
    }

    videoElement.width = videoWidth;
    videoElement.height = videoHeight;
    canvasElement.width = videoWidth;
    canvasElement.height = videoHeight;
    peerCanvasElement.width = videoWidth;
    peerCanvasElement.height = videoHeight;
  }
  function handleResize() {
    setAspectRatio();
  }
  function videoCheck() {
    try {
      videoOn = !videoOn;
      if (videoOn) {
        streamVideo();
      } else {
        stopStream();
      }
    } catch {
      videoOn = !videoOn;
    }
  }
  function audioCheck() {
    try {
      console.log("try");
      audioOn = !audioOn;

      if (audioOn) {
        stream.unmuteAudio().then(document.querySelector("#micButton").classList.toggle("meeting-control-button__off"));
      } else {
        stream.muteAudio().then(document.querySelector("#micButton").classList.toggle("meeting-control-button__off"));
      }
    } catch (e) {
      console.log("catch");
      audioOn = !audioOn;
    }
  }
</script>

<svelte:head />
<Nav>화상진료</Nav>
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
    <canvas id="participant-videos-canvas" />
    <video id="my-self-view-video" playsinline />
    <canvas id="my-self-view-canvas" />
  </div>
  <div id="tel_control">
    <div class="tools">
      <button type="button" class="hicon_video" on:click={videoCheck} />
      <button type="button" class="hicon_mic" on:click={audioCheck} />
      <!-- <button type="button" class="hicon_mes" />
      <button type="button" class="hicon_fol" /> -->
    </div>
    <button
      type="button"
      class="mbtn_r_1 btn_01"
      id="show"
      value="화상진료가 종료되었습니다."
      on:click={() => {
        checkLeave = true;
        stopStream();
      }}>화상 진료 종료</button
    >
  </div>
</section>
