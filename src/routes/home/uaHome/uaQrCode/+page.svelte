<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import jsQR from "jsqr";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { isLogin } from "$lib/store/loginStore";
  import { getUserId } from "$lib/js/getUserId";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  let videoElement;
  let canvasElement;
  let videoStream = null;
  let stopQR = false;
  let popUp = false;
  let popUpWhat = "";
  let favShpId;
  let mbrId = 0;
  let jwt;
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          mbrId = result;
        }
      });
    } catch (err) {
      //에러가 토큰기간만료 코드라면 다시 재발급을 진행
      try {
        if (err.message == "21009") {
          await updateRefresh(refresh);
          location.reload();
        } else {
          //아니라면 그냥 에러 출력.
          console.error(err);
        }
      } catch (err) {
        //토큰 재발급 과정에서 에러 발생 시, 다시 로그인하도록 로그인 화면으로 보낸다.
        console.error(err);
        localStorage.setItem("refreshJwt", "");
        localStorage.setItem("userJwt", "");
        alert("토큰 재발급 오류 발생. 다시 로그인해주세요");
        $isLogin = false;
        goto("/mbr/uaLogin");
      }
    }
    initializeCamera();
    window.addEventListener("resize", updateVideoSize);
    // 초기 로드 시에도 비디오 사이즈를 업데이트합니다.
    updateVideoSize();
  });

  // 비디오 사이즈를 업데이트하는 함수입니다.
  function updateVideoSize() {
    if (!videoElement) return;
    // 메뉴 바 높이를 고려한 비디오 컨테이너의 높이를 계산합니다.
    const menuBarHeight = 80; // 메뉴 바 높이가 고정된 경우
    const videoContainerHeight = window.innerHeight - menuBarHeight;
    videoElement.style.height = `${videoContainerHeight}px`;
  }

  // 카메라 초기화 및 스트림 설정
  async function initializeCamera() {
    try {
      const constraints = {
        video: {
          facingMode: "environment",
          // HD 해상도를 요청할 수 있습니다.
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;
      // 메타데이터가 로드된 후에 비디오 사이즈를 업데이트합니다.
      videoElement.onloadedmetadata = () => {
        updateVideoSize();
        getQR();
      };
    } catch (error) {
      console.error("카메라 접근에 실패하였습니다.", error);
    }
  }

  async function getQR() {
    if (stopQR) {
      return;
    }

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    console.log(canvasElement.width);
    const context = canvasElement.getContext("2d");
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      let qrData = code.data;
      console.log("스캔된 QR 코드:", qrData);
      let params = new URLSearchParams(new URL(qrData).search);
      let qrShpId = params.get("qrShpId");
      console.log(qrShpId);
      if (qrShpId != "" && qrShpId != null) {
        favShpId = qrShpId;
        if (videoStream) {
          videoStream.getTracks().forEach((track) => track.stop());
          videoStream = null;
        }
        popUpWhat = "qrFav";
        popUp = true;
        stopQR = true;
        return;
      }
    }
    // 다음 프레임에서 QR 코드 스캔을 계속 수행합니다.
    requestAnimationFrame(getQR);
  }
  async function addFavQR() {
    let jsonStr = makeStr({ shpId: favShpId, mbrId });
    const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/favShop/addFavQR";
    let res = await postAPI(url, jsonStr, jwt);
    if (res.resultVO == "H") {
      popUp = false;
      goto(urlList.uaHptDtl + "?shpId=" + favShpId + "&shpType=shp");
    } else if (res.resultVO == "D") {
      popUp = false;
      goto(urlList.uaFavDrstLst);
    }
  }
  function xButton() {
    popUp = false;
    popUpWhat = "";
    stopQR = false;
    getQR();
  }
  function closeQr(event) {
    event.stopPropagation();
    stopQR = true;
    console.log("closeQr 함수가 호출되었습니다.");

    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      videoStream = null;
    }
    goto(urlList.uaHome);
  }
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<div class="video-container" style="overflow: hidden;  height: calc(100vh - 80px);">
  <button
    type="button"
    class="alert_close"
    on:click={closeQr}
    style="position: absolute; top: 10px; right: 10px; z-index: 10; font-size: 48px; "
  >
    <i class="xi-close-min" />
  </button>
  <p
    style="position: absolute; top: 5%; left: 50%; transform: translate(-50%, -50%); z-index: 5; font-size:20px; color:white"
  >
    QR 코드
  </p>
  <div
    style="position: absolute; top: 20%; left: 50%; transform: translate(-50%, -50%); z-index: 5; text-align: center; width: 80%; max-width: 600px; color:white"
  >
    <p style="font-size: 24px; font-weight:bold">병원의 QR 코드를 찍어주세요</p>
    <br />
    <p style="font-size: 20px;">단골 병원으로 추가할 수 있습니다</p>
  </div>
  <div
    class="scanner-box"
    style="width: 300px; 
  height: 300px; 
  border: 5px dashed  #FFF;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);"
  />
  <video
    bind:this={videoElement}
    autoplay
    playsinline
    style=" width: 100%;
  object-fit: cover;"
  />
  <canvas bind:this={canvasElement} style="display: none;" />
</div>
{#if popUpWhat == "qrFav"}
  <PopUp {popUp}>
    <slot
      >단골병원으로 추가하시겠습니까?<button type="button" class="alert_close" on:click={xButton}
        ><i class="xi-close-min" /></button
      >
    </slot>
    <p slot="btns" class="btn_wrap" id="btn">
      <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={addFavQR}>예</button>
      <button type="button" class="mbtn_n_9" name="chbtn" id="close" on:click={xButton}>아니오</button>
    </p>
    <p />
  </PopUp>
{/if}
