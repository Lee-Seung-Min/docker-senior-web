<script>
    // @ts-nocheck

    import Nav from "$lib/sub/nav/Nav.svelte";
    import { goto } from "$app/navigation";
    import { urlList } from "$lib/urlList";
    import PopUp from "$lib/sub/nav/PopUp.svelte";
    import { getCall, goMap } from "$lib/js/phoneAction";
    import { isLogin } from "$lib/store/loginStore";

    let popUp = false;
    let popUpWhat = "";
    let callNumber = "02-3487-8585";

    function gotoPage(url) {
        goto(url);
    }

    function xButton() {
        popUp = false;
    }

    function registerFace() {
        if (
            window.AndroidBridge &&
            typeof window.AndroidBridge.updateToken === "function"
        ) {
            window.AndroidBridge.registerFace();
        } else {
            alert("제공되지 않는 서비스입니다.");
        }
    }

    function logout() {
        if (
            window.AndroidBridge &&
            typeof window.AndroidBridge.updateToken === "function"
        ) {
            window.AndroidBridge.logout();
        } else {
            alert("로그아웃 되었습니다.");
            
            localStorage.setItem("userJwt", "");
            localStorage.setItem("refreshJwt", "");
            localStorage.setItem("logintool", "");

            isLogin.set(false);
            goto(urlList.uaLogin);
        }
    }
</script>

<Nav>설정</Nav>
<section class="contents">
    <div class="list_box">
        <button
            type="button"
            class="box_2"
            on:click={() => gotoPage(urlList.uaMbrInfo)}
        >
            <i class="xi-user-o" />
            <span class="menuSpan">회원정보 수정</span>
        </button>
        <button type="button" class="box_2" on:click={() => registerFace()}>
            <i class="xi-user-o" />
            <span class="menuSpan">안면인식 등록</span>
        </button>
        <button
            type="button"
            class="box_2"
            on:click={() => gotoPage(urlList.uaFamLst)}
        >
            <i class="xi-users-o" />
            <span class="menuSpan">가족관리</span>
        </button>
        <!-- 결제수단 관리는 추후 다른 은행앱이나 페이앱 없이 결제가능한 것 개발 된 후에 개방 예정. 
      배송지 목록 관리는 추후 약배달이 된다면 개방 예정. -->
        <button
            type="button"
            class="box_2"
            on:click={() => {
                gotoPage(urlList.uaMbrCrdLst);
                // popUp = true;
            }}
        >
            <i class="xi-credit-card" />
            <span class="menuSpan">결제수단 관리</span>
        </button>
        <button
            type="button"
            class="box_2"
            on:click={() => gotoPage(urlList.uaAlarmAgree)}
        >
            <i class="xi-bell-o" />
            <span class="menuSpan">알람 및 동의 설정</span>
        </button>
        <button
            type="button"
            class="box_2"
            on:click={() => {
                goto(urlList.uaPolicy);
            }}
            ><i class="xi-shield-checked-o" /><span class="menuSpan"
                >서비스 이용약관</span
            ></button
        >
        <button
            type="button"
            class="box_2"
            on:click={() => {
                popUp = true;
                popUpWhat = "call";
            }}
            ><i class="xi-phone" />
            <span class="menuSpan">고객센터</span></button
        >
        <button type="button" class="box_2" on:click={() => logout()}>
            <i class="xi-user-o" />
            <span class="menuSpan">로그아웃</span>
        </button>
    </div>
</section>
{#if popUpWhat == "version"}
    <PopUp {popUp}>
        버전정보 1.2.1
        <button type="button" class="alert_close" on:click={xButton}>
            <i class="xi-close-min" />
        </button>
        <p class="btn_wrap" id="btn" slot="btns">
            <button type="button" class="mbtn_n_4" id="close" on:click={xButton}
                >확인</button
            >
        </p>
    </PopUp>
{:else if popUpWhat == "call"}
    <PopUp {popUp}>
        전화번호: {callNumber}
        <br />
        운영시간 09:00 ~ 18:00
        <br />
        <br />
        <button
            type="button"
            class="mbtn_b_1"
            on:click={() => {
                getCall(callNumber);
            }}>전화하기</button
        >
        <button
            type="button"
            class="mbtn_b"
            on:click={() => {
                goMap("https://pf.kakao.com/_xjVxiYG");
            }}
            ><i class="xi-comment-o" /><span class="menuSpan"
                >카카오톡 채널</span
            ></button
        >
        <button type="button" class="alert_close" on:click={xButton}>
            <i class="xi-close-min" />
        </button>
    </PopUp>
{/if}

<!-- <PopUp {popUp}>
  서비스 준비중입니다.
  <button type="button" class="alert_close" on:click={closePopup}>
    <i class="xi-close-min" />
  </button>
  <p class="btn_wrap" id="btn" slot="btns">
    <button type="button" class="mbtn_n_4" id="close" on:click={closePopup}>확인</button>
  </p>
</PopUp> -->
