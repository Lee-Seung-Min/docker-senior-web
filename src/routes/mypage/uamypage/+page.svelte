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
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { dgnsType } from "$lib/store/rgstStore.js";
  import { searchType, searchData, searchWhat } from "$lib/store/search";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { getCall, goMap } from "$lib/js/phoneAction";
  let mem = [];
  let memberId;
  let popUpWhat = "";
  let callNumber = "02-3487-8585";
  onMount(async () => {
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          const url = /*urlAddr + "8083*/ authUrlAddr + "/v1/member/selectMemberInfo?memberid=" + jwt;
          let resData = await getAPI(url, jwt);
          mem = resData;
          console.log(mem);
          $footCheck = "menu3";
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
  let popUp = false;

  //닫기버튼
  function xButton() {
    popUp = false;
  }

  //신규예약 팝업
  function doReg(e) {
    popUp = true;
  }
</script>

<Nav>내 정보</Nav>
<div class="info_tap">
  <div>
    <p><span>{mem.mbrName} 님</span></p>
  </div>
</div>
<section class="contents">
  <div class="list_box">
    <button
      type="button"
      class="box_2"
      id="show_reg"
      on:click={() => {
        $searchType = "H";
        $searchData = "";
        $searchWhat = "A";
        $dgnsType = "";
        goto(urlList.uaHsptSrchMap);
      }}
      value="어느 방식을 선택하시겠습니까?"><i class="xi-new-o" /><span class="menuSpan">신규예약</span></button
    >
    <button type="button" class="box_2" on:click={() => goto(urlList.uaFavHsptLst)}
      ><i class="xi-hospital" /><span class="menuSpan">단골 병원</span></button
    >
    <button type="button" class="box_2" on:click={() => goto(urlList.uaFavDrstLst)}
      ><i class="xi-pharmacy" /><span class="menuSpan">단골 약국</span></button
    >
    <button type="button" class="box_2" on:click={() => goto(urlList.uaMbrHlthLst)}
      ><i class="xi-document" /><span class="menuSpan">나의 건강기록 목록</span></button
    >
    <button type="button" class="box_2" on:click={() => goto(urlList.uaNtctLst)}
      ><i class="xi-comment-o" /><span class="menuSpan">공지사항</span></button
    >
    <button
      type="button"
      class="box_2"
      on:click={() => {
        goto(urlList.uaPolicy);
      }}><i class="xi-shield-checked-o" /><span class="menuSpan">서비스 이용약관</span></button
    >
    <button
      type="button"
      class="box_2"
      on:click={() => {
        popUp = true;
        popUpWhat = "call";
      }}><i class="xi-phone" /> <span class="menuSpan">고객센터</span></button
    >
    <button
      type="button"
      class="box_2"
      on:click={() => {
        popUp = true;
        popUpWhat = "version";
      }}><i class="xi-comment-o" /><span class="menuSpan">버전정보</span></button
    >
  </div>
</section>

{#if popUpWhat == "version"}
  <PopUp {popUp}>
    버전정보 1.1.2
    <button type="button" class="alert_close" on:click={xButton}>
      <i class="xi-close-min" />
    </button>
    <p class="btn_wrap" id="btn" slot="btns">
      <button type="button" class="mbtn_n_4" id="close" on:click={xButton}>확인</button>
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
      }}><i class="xi-comment-o" /><span class="menuSpan">카카오톡 채널</span></button
    >
    <button type="button" class="alert_close" on:click={xButton}>
      <i class="xi-close-min" />
    </button>
  </PopUp>
{/if}
