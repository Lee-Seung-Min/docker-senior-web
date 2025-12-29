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


  let videoOn = false;
  let audioOn = false;
  let videoDevices;
  let localVideoTrack;
  let audioDevices;
  let localAudioTrack;
  let dgnsId;
  const VOLUME_ANIMATION_INTERVAL_MS = 100;
  let volumeAnimation = null;
  let prevVolumeAnimationStyle = "";
  let micIcon;
  let micButton;
  onMount(async () => {
    dgnsId = $page.url.searchParams.get("dgnsId");
    setAspectRatio();
    const ZoomVideo = window.WebVideoSDK.default;

    ZoomVideo.getDevices().then((devices) => {
      videoDevices = devices.filter((device) => {
        return device.kind === "videoinput";
      });

      localVideoTrack = ZoomVideo.createLocalVideoTrack(videoDevices[0].deviceId);
      //localVideoTrack.start(document.querySelector("#preview-camera-video"));
      audioDevices = devices.filter((device) => {
        return device.kind === "audioinput";
      });

      localAudioTrack = ZoomVideo.createLocalAudioTrack(audioDevices[0].deviceId);
      localAudioTrack.start();
    });
  });

  // turn on camera preview
  function previewVideoButton() {
    localVideoTrack
      .start(document.querySelector("#preview-camera-video"))
      .then(document.querySelector("#videoButton").classList.toggle("meeting-control-button__off"));
  }

  // turn off camera preview
  function stopPreviewVideoButton() {
    localVideoTrack.stop().then(document.querySelector("#videoButton").classList.toggle("meeting-control-button__off"));
  }

  // turn on microphone preview
  function previewMicrophoneButton() {
    localAudioTrack.unmute().then(micButton.classList.toggle("meeting-control-button__off"));
    // add logic to display microphone volume level using localMicrophoneTrack.getCurrentVolume()
    startVolumeAnimation();
  }

  const animateMicVolume = () => {
    const newVolume = localAudioTrack.getCurrentVolume();
    let newVolumeAnimationStyle = "";
    micIcon = document.querySelector("#micIcon");
    if (newVolume === 0) {
      newVolumeAnimationStyle = "";
    } else if (newVolume <= 0.1) {
      newVolumeAnimationStyle = "mic-feedback__very-low";
    } else if (newVolume <= 0.2) {
      newVolumeAnimationStyle = "mic-feedback__low";
    } else if (newVolume <= 0.3) {
      newVolumeAnimationStyle = "mic-feedback__medium";
    } else if (newVolume <= 0.4) {
      newVolumeAnimationStyle = "mic-feedback__high";
    } else if (newVolume <= 0.5) {
      newVolumeAnimationStyle = "mic-feedback__very-high";
    } else {
      newVolumeAnimationStyle = "mic-feedback__max";
    }

    if (prevVolumeAnimationStyle !== "") {
      micIcon.classList.toggle(prevVolumeAnimationStyle);
    }

    if (newVolumeAnimationStyle !== "") {
      micIcon.classList.toggle(newVolumeAnimationStyle);
    }
    prevVolumeAnimationStyle = newVolumeAnimationStyle;
  };

  const startVolumeAnimation = () => {
    if (!volumeAnimation) {
      volumeAnimation = setInterval(animateMicVolume, VOLUME_ANIMATION_INTERVAL_MS);
    }
  };

  const endVolumeAnimation = () => {
    if (volumeAnimation) {
      clearInterval(volumeAnimation);
      volumeAnimation = null;
    }
  };

  // turn off microphone preview
  function stopPreviewMicrophoneButton() {
    localAudioTrack.mute().then(micButton.classList.toggle("meeting-control-button__off"));

    endVolumeAnimation();
  }

  function videoCheck() {
    try {
      console.log("try");
      videoOn = !videoOn;

      if (videoOn) {
        previewVideoButton();
      } else {
        stopPreviewVideoButton();
      }
    } catch (e) {
      console.log("catch");
      videoOn = !videoOn;
    }
  }
  function audioCheck() {
    try {
      console.log("try");
      audioOn = !audioOn;
      micButton = document.querySelector("#micButton");
      if (audioOn) {
        previewMicrophoneButton();
      } else {
        stopPreviewMicrophoneButton();
      }

      if (prevVolumeAnimationStyle) {
        micIcon.classList.toggle(prevVolumeAnimationStyle);
        prevVolumeAnimationStyle = "";
      }
    } catch (e) {
      console.log("catch");
      audioOn = !audioOn;
    }
  }
  function join() {
    if (audioOn) {
      localAudioTrack.stop();
    }
    if (videoOn) {
      localVideoTrack.stop();
    }

    goto(urlList.uaVdoDgns + "?dgnsId=" + dgnsId);
  }
  function setAspectRatio() {
    const videoElement = document.querySelector("#preview-camera-video");
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    const screenWidthPx = screenWidth - 48;
    // 원하는 비율 (예: 16:9)
    const targetAspectRatio = 16 / 9;

    let videoWidth = screenWidthPx;
    let videoHeight = screenHeight;

    // 화면 비율 조정
    if (screenWidthPx / screenHeight > targetAspectRatio) {
      videoWidth = screenHeight * targetAspectRatio;
    } else {
      videoHeight = screenWidthPx / targetAspectRatio;
    }

    videoElement.width = videoWidth;
    videoElement.height = videoHeight;
    // 윈도우 크기가 변경될 때 화면 비율 조정
    window.addEventListener("resize", setAspectRatio);
  }
</script>

<Nav>장치확인</Nav>

<section class="contents">
  <div class="telChk">
    <div class="telimg" />
    <video id="preview-camera-video" playsinline />
    <div class="vdodgnscheck">
      <button type="button" class="meeting-control-button" id="videoButton">
        <img
          src={new URL("/src/assets/img/icon_h_video.svg", import.meta.url).href}
          on:click={videoCheck}
          class="img"
          alt="."
        />
      </button>
      <button type="button" class="meeting-control-button" id="micButton" on:click={audioCheck}>
        <img src={new URL("/src/assets/img/icon_h_mic.svg", import.meta.url).href} class="img" alt="." id="micIcon" />
      </button>
    </div>

    <!-- <div class="btn_wrap inline">
      <button type="button" class="btn_01">테스트 재생</button>
    </div> -->
    <div class="btn_wrap inline">
      <button type="button" class="mbtn_r_1 btn_01" on:click={join}>진료실 입장</button>
    </div>
  </div>
</section>
