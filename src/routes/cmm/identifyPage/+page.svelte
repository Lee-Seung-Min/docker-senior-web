<script>
  //@ts-nocheck
  import { getAPI } from "$lib/js/getAPI";
  import { authUrlAddr } from "$lib/js/urlAddr";
  import { isLogin } from "$lib/store/loginStore";
  import { onDestroy, onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getUserId } from "$lib/js/getUserId";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";

  var KMCIS_window;

  let tr_cert = "";
  let tr_url = import.meta.env.VITE_IDENTIFY_REDIRECT_URL; //결과값 전송 페이지
  let tr_ver = "V2";

  let userJwt;

  onMount(() => {
    $isLogin = false;
    userJwt = localStorage.getItem("userJwt");
    if (localStorage.getItem("logintool") == "kakao") {
      if (!Kakao.isInitialized()) {
        Kakao.init("61293c54f9207fc7739fb7c9618d457c");
      }
    }
  });

  async function start(event) {
    await getAPI(authUrlAddr + "/identify/startIdentify") //암호화 데이터
      .then(async (res) => {
        tr_cert = res.resultVO;
        console.log(tr_cert);
      })
      .then((res) => {
        window.name = "kmcis_web";

        var UserAgent = navigator.userAgent;

        /* 모바일 접근 체크*/
        // 모바일일 경우 (변동사항 있을경우 추가 필요)
        if (
          UserAgent.match(
            /iPhone|iPad|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i
          ) != null ||
          UserAgent.match(/LG|SAMSUNG|Samsung/) != null
        ) {
          document.reqKMCISForm.target = "";
        }
        // 모바일이 아닐 경우
        else {
          KMCIS_window = window.open(
            "",
            "KMCISWindow",
            "width=425, height=550, resizable=0, scrollbars=no, status=0, titlebar=0, toolbar=0, left=435, top=250"
          );

          if (KMCIS_window == null) {
            alert(
              " ※ 윈도우 XP SP2 또는 인터넷 익스플로러 7 사용자일 경우에는 \n    화면 상단에 있는 팝업 차단 알림줄을 클릭하여 팝업을 허용해 주시기 바랍니다. \n\n※ MSN,야후,구글 팝업 차단 툴바가 설치된 경우 팝업허용을 해주시기 바랍니다."
            );
          }

          document.reqKMCISForm.target = "KMCISWindow";
        }

        document.reqKMCISForm.action = "https://www.kmcert.com/kmcis/web/kmcisReq.jsp";
        document.reqKMCISForm.submit();
      })

      .catch((err) => {
        console.error(err);
        alert("오류가 발생했습니다. 계속 해당 오류가 발생시, 문의 바랍니다.");
      });
  }

  //로그아웃 버튼 클릭 시
  async function back(event) {
    event.preventDefault();
    console.log("back 시작");
    //카카오라면 카카오 로그아웃을 진행한다.
    if (localStorage.getItem("logintool") == "kakao") {
      await getUserId(userJwt)
        .then(async (result) => {
          //로그아웃시 device토큰 없앰
          let jsonStr = makeStr({ dvcToken: "", mbrId: result });
          const url = authUrlAddr + "/v1/member/saveDvcToken";
          let res = await postAPI(url, jsonStr, userJwt);
          console.log(res);
        })
        .then(() => {
          localStorage.setItem("userJwt", "");
          localStorage.setItem("refreshJwt", "");
          localStorage.setItem("logintool", "");
          $isLogin = false;
          $isLogin = false;
          goto(
            "https://kauth.kakao.com/oauth/logout?" +
              "client_id=" +
              import.meta.env.VITE_KAKAO_API_KEY +
              "&logout_redirect_uri=" +
              import.meta.env.VITE_LOGIN_PAGE
          );
        })
        .catch(function (error) {
          console.error(error);
          alert("로그아웃에 실패했습니다. 해당 오류가 지속적으로 발생하면 문의 바랍니다.");
        });
    }
    //구글, 애플이라면 데이터만 삭제
    else if (localStorage.getItem("logintool") == "google" || localStorage.getItem("logintool") == "apple") {
      localStorage.setItem("userJwt", "");
      localStorage.setItem("refreshJwt", "");
      localStorage.setItem("logintool", "");
      $isLogin = false;
      $isLogin = false;
      //로그아웃이 완료되면 로그인페이지로 이동
      goto(urlList.uaLogin);
    }
  }
</script>

<body class="on login">
  <div style="margin-top: 30px;">
    <div class="identifyTitle">휴대폰 본인인증 안내</div>
    <div class="identifyContent">바로닥터를 사용하기 위해서는 휴대폰 본인인증이 필요합니다.</div>
    <div class="identifyContent">아래 버튼을 눌러서 휴대폰 본인인증을 진행해주세요.</div>

    <form name="reqKMCISForm" method="get" action="#">
      <input type="hidden" name="tr_cert" bind:value={tr_cert} />
      <input type="hidden" name="tr_url" bind:value={tr_url} />
      <input type="hidden" name="tr_ver" bind:value={tr_ver} />
      <div class="btn_wrap" style="position: absolute; bottom: 0; width: 100%; display:flex">
        <button class="btn_01" style="background-color: #f85c5c; width: 49%; margin-right:1%" on:click={back}
          >로그아웃</button
        >
        <button class="btn_01" style="width: 49%; margin-left:1%; margin-top:0" on:click={start}>휴대폰 본인인증</button
        >
      </div>
    </form>
  </div>
</body>

<style>
  .identifyTitle {
    padding: 30px 15px;
    font-size: 20px;
    color: #0fa5d4;
    font-weight: bold;
  }

  .identifyContent {
    font-size: 15px;
    padding: 0 15px 30px 15px;
  }
</style>
