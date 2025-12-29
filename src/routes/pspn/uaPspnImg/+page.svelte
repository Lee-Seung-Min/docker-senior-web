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
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { getFetch } from "$lib/js/getFetch";

  let pspnId;
  let imgUrl;
  let imgBlob = null;
  let scale = 1;
  let popUpWhat;
  let popUp=false;
  let faxNumber = '';
  onMount(async () => {
    pspnId = $page.url.searchParams.get("pspnId");
    $footCheck = "menu2";
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          getPhoto();
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
  });
  async function getPhoto() {

    try {
      const response = await fetch(mobileUrlAddr + '/v1/pspn/getPspnImg?id='+pspnId + '&isDgnsId=false',{
        headers: {
          "bizportal-access-token": localStorage.getItem("bizportal-access-token")
        }
      })
      let result = await response.json()
      imgUrl = result.imageUrl

    } catch(error) {

    }

    const url = shopUrlAddr + "/v1/shop/storage/getPspnImage?pspnId=" + pspnId;
    let resData = await getFetch(url, localStorage.getItem("userJwt"));
    let blob = await resData.blob();
    console.log(blob);
  imgUrl = URL.createObjectURL(blob);
  imgBlob = blob; // store blob for upload
  }
  // 확대 함수
  function zoomIn() {
    scale *= 1.3; // 확대 비율을 30% 증가
  }

  // 축소 함수
  function zoomOut() {
    scale /= 1.3; // 확대 비율을 30% 감소
  }

  async function sendFTP(){
    if (!imgBlob) {
      alert('이미지가 로드되지 않았습니다. 다시 시도하세요.');
      return;
    }
    try {
      // 파일 이름 생성: pspn_<id>_yyyyMMdd_HHmmss(확장자는 blob.type을 기반으로)
      const ext = imgBlob.type ? imgBlob.type.split('/').pop() : 'jpg';
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const fileName = `pspn_${pspnId}_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.${ext}`;

      // Blob -> File (File 생성자가 일부 브라우저에서 제한적일 수 있지만 대부분 지원)
      let file;
      try {
        file = new File([imgBlob], fileName, { type: imgBlob.type || 'image/jpeg' });
      } catch (e) {
        file = imgBlob;
        file.name = fileName;
      }

      const form = new FormData();
      form.append('file', file);
      form.append('fileName', fileName);
      form.append('pspnId', pspnId);

      const jwt = localStorage.getItem("userJwt");
      const endpoint = mobileUrlAddr + '/v1/webfax/sendFax';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: jwt ? { 'bizportal-access-token': jwt } : {},
        body: form
      });

      console.log("mobileUrlAddr + /v1/webfax/sendFax : ", res);
      
      const data = await res.json().catch(()=>null);
      if (data && data.errorType && (data.errorType === 'ALL_SUCCESS_OK' || data.errorType === 'ALL_SUCCESS')) {
        alert('전송 성공');
      } else if (data && data.errorType && data.errorType !== 'ALL_SUCCESS_OK') {
        console.warn('sendFTP response', data);
        alert('전송 결과: ' + JSON.stringify(data));
      } else {
        alert('전송 완료 (서버 응답 파싱 실패)');
      }
    } catch (err) {
      console.error(err);
      alert('전송 중 오류가 발생했습니다. 콘솔을 확인하세요.');
    }
  }
</script>

<Nav>전자처방전</Nav> 
<section class="contents">
  <div style="width: 100%; height: calc(100vh - 200px); position: relative;">
    <div class="pspn-container" style="overflow: auto;">
      <!-- svelte-ignore a11y-missing-attribute -->
      <img src={imgUrl} style="transform: scale({scale});transform-origin:  top left;" />
    </div>
    <div class="zoom-controls">
      <button class="plus" on:click={zoomIn}></button>
      <button class="minus" on:click={zoomOut}></button>
    </div>
  </div>
</section>