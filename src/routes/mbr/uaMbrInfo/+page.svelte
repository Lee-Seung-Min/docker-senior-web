<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import Daum from "svelte-daum-postcode";
  import { getAPI } from "$lib/js/getAPI";
  import { postAPI } from "$lib/js/postAPI";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { authUrlAddr } from "$lib//js/urlAddr";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { getUserId } from "$lib/js/getUserId";
  import { makeStr } from "$lib/js/makeStr";
  /**
   * 로그인할 때 만들어진 jwt를 저장하는 함수
   */
  let userJwt = "";
  let refresh = "";
  let logintool = "";

  let name = "";
  let phone = "";
  let addNum = "";
  let add = "";
  let addDetail = "";
  let id = "";

  let addToggle = false;
  let popUp = false;
  let selectPopUp = "";

  /**
   * 페이지 로딩시에 현재 로그인 되어있는 고객의 정보를 가져온다.
   */
  onMount(async () => {
    //카카오 초기화가 되어있지 않다면 초기화 진행
    if (!Kakao.isInitialized()) {
      Kakao.init("61293c54f9207fc7739fb7c9618d457c");
    }

    // 동적으로 메타 태그 추가
    const metaTag = document.createElement("meta");
    metaTag.name = "appleid-signin-redirect-uri";
    metaTag.content = import.meta.env.VITE_APPLE_SIGNIN_REDIRECT_URI;
    document.head.appendChild(metaTag);

    userJwt = localStorage.getItem("userJwt");
    refresh = localStorage.getItem("refreshJwt");
    logintool = localStorage.getItem("logintool");
    try {
      const url = authUrlAddr + "/v1/member/selectMemberInfo";
      let result = await getAPI(url, userJwt);
      console.log(result);
      id = result.mbrId;
      name = result.mbrName;
      phone = result.mbrTel;
      addNum = result.mbrZip;
      add = result.mbrAddr;
      addDetail = result.mbrAddrDtl;
    } catch (err) {
      console.log(err);
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
        goto(urlList.uaLogin);
      }
    }
  });

  /**
   * 회원 정보를 업데이트하는 함수
   */
  async function updateData() {
    const url = authUrlAddr + "/v1/member/updateMemberInfo";

    if (name == "") {
      selectPopUp = "error";
      popUp = true;
    }

    const memberData = {
      mbrAddr: add,
      mbrAddrDtl: addDetail,
      mbrZip: addNum,
      mbrTel: phone,
      mbrName: name,
    };

    const result = await postAPI(url, JSON.stringify(memberData), userJwt);
    if (result == 1) {
      //수정 완료됐다는 창 띄우고 메뉴화면으로 이동
      selectPopUp = "success";
      popUp = true;
    } else {
      //수정 실패했다는 창 띄움
      selectPopUp = "fail";
      popUp = true;
    }
  }

  /**
   * 주소검색 창을 여닫는 함수
   */
  function toggleButton() {
    addToggle = !addToggle;
  }

  /**
   * 주소검색 창에서 주소를 선택 한 후에 선택한 데이터를 input에 추가하는 함수
   * @param detail 선택한 주소의 자세한 정보가 들어가 있는 json
   */
  function addComplete({ detail: { data } }) {
    addNum = data.zonecode;
    add = data.address;
    addToggle = false;
  }

  /**
   * 탈퇴가 확실한지 확인창을 여는 함수
   */
  function quitCheck() {
    console.log("quit");
    selectPopUp = "quitCheck";
    popUp = true;
  }

  /**
   * 탈퇴를 진행하는 함수
   */
  async function quitFunction() {
    popUp = false;
    if (logintool == "kakao") {
      const url = authUrlAddr + "/kakao/quitKakaoMember";
      try {
        await postAPI(url, id).then((result) => {
          if (result > 0) {
            localStorage.setItem("userJwt", "");
            localStorage.setItem("refreshJwt", "");
            localStorage.setItem("logintool", "");
            selectPopUp = "quit";
            popUp = true;
          } else {
            throw new Error("회원탈퇴에 실패했습니다.");
          }
        });
      } catch (err) {
        console.error(err);
        selectPopUp = "fail";
        popUp = true;
      }
    } else if (logintool == "google") {
      const url = authUrlAddr + "/kakao/quitGoogleMember";
      try {
        await postAPI(url, id).then((result) => {
          if (result > 0) {
            localStorage.setItem("userJwt", "");
            localStorage.setItem("refreshJwt", "");
            localStorage.setItem("logintool", "");
            selectPopUp = "googlequit";
            popUp = true;
          } else {
            throw new Error("회원탈퇴에 실패했습니다.");
          }
        });
      } catch (err) {
        console.error(err);
        selectPopUp = "fail";
        popUp = true;
      }
    }
  }
</script>

<svelte:head>
  <meta name="appleid-signin-client-id" content="com.barodoctor.barodoctor" />
  <meta name="appleid-signin-scope" content="name email" />
  <!--  <meta name="appleid-signin-redirect-uri" content="https://was.barodoctor.com/auth/kakao/applequit" />-->
  <!--  <meta name="appleid-signin-redirect-uri" content="https://was.barodoctor.com/authTest/kakao/applequit" />-->
  <meta name="appleid-signin-state" content="fwilahwiuSFSFgfsywesgfFGSDFsafwgaw" />
  <!-- <meta name="appleid-signin-nonce" content="[NONCE]" /> -->
  <meta name="appleid-signin-use-popup" content="false" />
</svelte:head>

<Nav>회원정보 수정</Nav>
<section class="contents">
  <script
    type="text/javascript"
    src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/ko_KR/appleid.auth.js"
  ></script>
  <div class="form_wrap">
    <label>
      <input type="text" id name bind:value={name} maxlength="10" />
      <span>이름</span>
    </label>

    <label>
      <input type="text" id name bind:value={phone} maxlength="13" />
      <span>휴대전화</span>
      <!-- <button class="mbtn_b">인증완료</button> -->
    </label>

    <label class="add">
      <input type="text" maxlength="11" id name bind:value={addNum} title="우편번호" />
      <span>주소</span>
      <button class="mbtn_n" on:click={toggleButton}>주소 찾기</button>
    </label>

    {#if addToggle}
      <div>
        <Daum height="500px" autoClose="true" on:complete={addComplete} />
      </div>
    {/if}

    <label class="add">
      <input type="text" id name bind:value={add} title="기본주소" maxlength="30" />
    </label>

    <label class="add">
      <input type="text" id name bind:value={addDetail} title="상세주소" maxlength="100" />
    </label>

    <div class="btn_wrap">
      <button class="btn_01" on:click={updateData}>정보수정</button>
    </div>

    {#if logintool == "apple"}
      <div style="display: flex; align-items: center; justify-content: center; padding-top : 5px">
        <div style="padding-right: 20px;">회원탈퇴</div>
        <div id="appleid-signin" data-color="black" data-border="true" data-type="sign in" data-mode="logo-only" />
      </div>
    {:else if logintool == "kakao" || logintool == "google"}
      <div class="btn_wrap inline" style="margin-top: 5px !important;">
        <button class="mbtn_t logout" on:click={quitCheck}>회원탈퇴</button>
      </div>
    {/if}
  </div>
</section>

{#if selectPopUp == "success"}
  <PopUp {popUp}>
    <slot>
      <h2>수정 완료</h2>
      <br />수정 되었습니다.
    </slot>
    <div slot="btns" class="btn_wrap">
      <button
        type="button"
        class="btn_04"
        name="chbtn"
        id="visit"
        on:click={() => {
          popUp = false;
          history.back();
        }}
      >
        확인
      </button>
    </div>
  </PopUp>
{:else if selectPopUp == "error"}
  <PopUp {popUp}>
    <slot>
      <h2>실패</h2>
      <br />이름을 입력해주세요.
    </slot>
    <div slot="btns" class="btn_wrap">
      <button
        type="button"
        class="btn_04"
        name="chbtn"
        id="visit"
        on:click={() => {
          popUp = false;
        }}
      >
        확인
      </button>
    </div>
  </PopUp>
{:else if selectPopUp == "fail"}
  <PopUp {popUp}>
    <slot>
      <h2>실패</h2>
      <br />오류가 발생했습니다. 다시 시도해주세요.
      <button
        type="button"
        class="alert_close"
        on:click={() => {
          popUp = false;
        }}
      >
        <i class="xi-close-min" />
      </button>
    </slot>
    <div slot="btns" class="btn_wrap">
      <button
        type="button"
        class="btn_04"
        name="chbtn"
        id="visit"
        on:click={() => {
          popUp = false;
        }}
      >
        확인
      </button>
    </div>
  </PopUp>
{:else if selectPopUp == "quitCheck"}
  <PopUp {popUp}>
    <slot>
      <h2>탈퇴 확인</h2>
      <br />탈퇴 하시겠습니까?
      <button
        type="button"
        class="alert_close"
        on:click={() => {
          popUp = false;
        }}
      >
        <i class="xi-close-min" />
      </button>
    </slot>

    <div slot="btns" class="btn_wrap">
      <button type="button" class="btn_04" name="chbtn" id="visit" on:click={quitFunction}> 확인 </button>
      <button
        type="button"
        class="btn_04"
        name="chbtn"
        id="visit"
        on:click={() => {
          popUp = false;
        }}
      >
        취소
      </button>
    </div>
  </PopUp>
{:else if selectPopUp == "quit"}
  <PopUp {popUp}>
    <slot>
      <h2>탈퇴 완료</h2>
      <br />탈퇴가 완료됐습니다. 로그인 페이지로 이동합니다.
    </slot>

    <div slot="btns" class="btn_wrap">
      <button
        type="button"
        class="btn_04"
        name="chbtn"
        id="visit"
        on:click={() => {
          popUp = false;
          goto(urlList.uaLogin);
        }}
      >
        확인
      </button>
    </div>
  </PopUp>
{:else if selectPopUp == "googlequit"}
  <PopUp {popUp}>
    <slot>
      <h2>탈퇴 완료</h2>
      <br />탈퇴가 완료됐습니다. 구글 계정과의 연결해제까지 진행하시려면 '구글 서드 파티 연결 페이지'에서 직접
      연결해제를 진행바랍니다. 로그인 페이지로 이동합니다.
    </slot>

    <div slot="btns" class="btn_wrap">
      <button
        type="button"
        class="btn_04"
        name="chbtn"
        id="visit"
        on:click={() => {
          popUp = false;
          goto(urlList.uaLogin);
        }}
      >
        확인
      </button>
    </div>
  </PopUp>
{/if}
