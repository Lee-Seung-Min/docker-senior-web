<script>
  // @ts-nocheck

  import { onDestroy, onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { makeStr } from "$lib/js/makeStr";
  import { postAPI } from "$lib/js/postAPI";
  import { page } from "$app/stores";
  import { footCheck } from "$lib/store/navStore.js";
  import {
    dgnsShpId,
    dgnsDtrId,
    dgnsMemo,
    dgnsRsvDttm,
    dgnsDeptId,
    dgnsItemId,
    dgnsPatId,
    dgnsType,
    treat_target,
    treat_hspt,
    treat_dept,
    treat_item,
    treat_dtr,
    treat_deptNo,
    treat_itemNo,
    treat_dtrNo,
    wlkYon,
  } from "$lib/store/rgstStore.js";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { chngDateFormat, chngDateHourFormat, getSecretNumFirstFormat } from "$lib/js/dateFunction";
  import { decrypt, encrypt, getEncryptItems } from "$lib/js/aes256";
  let dateString;
  let popUp = false;
  let rgstStatus = false;
  let message;
  let dgnsMbrId;
  let jwt;
  let popUpWhat = "";
  let maskedNum;
  let regNumber;
  let agree = false;
  let dgnsBrth = "";
  let text = "";
  let dgnsMbrRegNum = "";
  let encryptItems = [];
  let timer;
  let countdown;
  let secondsLeft;
  onMount(async () => {
    $footCheck = "menu1";
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          dgnsMbrId = result;
          let date = new Date($dgnsRsvDttm);
          //yy.mm.dd hh24:mi 형식으로 변경
          if ($wlkYon == "N") {
            dateString = chngDateHourFormat(date);
          } else {
            dateString = chngDateFormat(date) + " ";
          }
          await getDgnsBrth();
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
  onDestroy(() => {
    handleBeforeUnload();
  });
  // 신규 예약 접수
  async function doReg() {
    if ($wlkYon == "Y") {
      const currentDateTime = new Date();
      const currentTime = currentDateTime.toTimeString().slice(0, 5); // HH:mm 형식의 시간
      dateString = dateString.slice(0, 10);
      dateString += " " + currentTime;
    }
    let jsonStr = makeStr({
      dgnsShpId: $dgnsShpId,
      dgnsDtrId: $dgnsDtrId,
      dgnsMemo: $dgnsMemo,
      dgnsRsvDttm: dateString,
      dgnsDeptId: $dgnsDeptId,
      dgnsItemId: $dgnsItemId,
      dgnsPatId: $dgnsPatId,
      dgnsType: $dgnsType,
      dgnsMbrId,
      dgnsWlkYon: $wlkYon,
      dgnsMbrRegNum,
    });

    let res = await postAPI(/*urlAddr + "8082*/ mobileUrlAddr + "/v1/dgns/uaDgnsRgst", jsonStr, jwt);
    switch (res.status) {
      case 0:
        message = res.message;
        popUp = true;
        rgstStatus = false;
        popUpWhat = "reg";
        break;
      case 1:
      case 2:
        //예약 관련 store 초기화
        $dgnsShpId = "";
        $dgnsDtrId = "";
        $dgnsMemo = "";
        $dgnsRsvDttm = "";
        $dgnsDeptId = "";
        $dgnsItemId = "";
        $dgnsPatId = "";
        $dgnsType = "";
        $treat_target = "";
        $treat_hspt = "";
        $treat_dept = "";
        $treat_item = "";
        $treat_dtr = "";
        $treat_deptNo = 0;
        $treat_itemNo = 0;
        $treat_dtrNo = 0;
        $wlkYon == "";
        popUp = true;
        rgstStatus = true;
        popUpWhat = "reg";
        handleClick();
        break;
      case 3:
      case 4:
        message = res.message;
        popUp = true;
        rgstStatus = false;
        popUpWhat = "reg";
        break;
      case 5:
        message = res.message;
        popUp = true;
        rgstStatus = false;
        popUpWhat = "reg";
        break;
    }
  }
  async function doSecretNumReg() {
    //주민등록번호 인터페이스 생성 전까지 주석
    // if ($dgnsPatId == 0) {
    //   console.log("주민번호 입력!!!");
    //   regNumber = "";
    //   maskedNum = "";
    //   text = "";
    //   agree = false;
    //   popUpWhat = "secretNum";
    //   popUp = true;
    // } else {
    //   doReg();
    // }
    doReg();
  }
  function xButton() {
    popUp = false;
  }
  function handleSecretNum(event) {
    const inputChar = event.target.value.slice(-1);
    if (event.inputType === "deleteContentBackward") {
      regNumber = regNumber.slice(0, -1);
    } else {
      if (/^\d*$/.test(inputChar)) {
        regNumber += inputChar;
      }
    }

    maskedNum = "*".repeat(regNumber.length);
  }
  function closeSecretNum() {
    xButton();
    regNumber = "";
    maskedNum = "";
    text = "";
    agree = false;
  }

  function checkSecretNum() {
    if (regNumber.length != 7) {
      text = "주민등록번호를 확인해주세요";
      return;
    }
    if (!agree) {
      text = "약관에 동의해 주세요";
      return;
    }
    text = "";
    encryptItems = getEncryptItems();
    dgnsMbrRegNum = encrypt(dgnsBrth + "-" + regNumber, encryptItems);
    doReg();
  }
  async function getDgnsBrth() {
    if ($dgnsPatId == 0) {
      let resData = await getAPI(authUrlAddr + "/v1/member/selectMemberInfo", jwt);
      dgnsBrth = getSecretNumFirstFormat(resData.mdtlBrth);
    }
    // else {
    //   let resData = await getAPI(authUrlAddr + "/v1/member/getFamilyInfo?id=" + $dgnsPatId);
    //   console.log(resData);
    //   dgnsBrth = getSecretNumFirstFormat(resData.fmlyBdte);
    // }
  }

  function handleClick() {
    // 기존 타이머가 있으면 취소
    if (timer) {
      clearTimeout(timer);
    }

    if (countdown) {
      clearInterval(countdown);
    }

    secondsLeft = 3;
    // 매 초마다 secondsLeft를 감소시키는 함수
    countdown = setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft -= 1;
      }
    }, 1000);
    // 3초 후에 delayedFunction 실행
    timer = setTimeout(() => {
      delayedFunction();
      clearInterval(countdown);
      timer = null; // 타이머가 실행된 후에는 null로 설정
    }, 3000);
  }
  function delayedFunction() {
    goto(urlList.uaDgnsLst);
  }

  // 페이지를 떠날 때 타이머 취소
  function handleBeforeUnload() {
    if (timer) {
      clearTimeout(timer);
      timer = null; // 타이머를 취소한 후에는 null로 설정
    }
    if (countdown) {
      clearInterval(countdown);
      countdown = null;
    }
  }
</script>

<!-- content S -->
<Nav>
  진료{#if $wlkYon == "N"}예약{:else}접수{/if} 확인
</Nav>
<section class="contents">
  <h3 class="big">
    진료{#if $wlkYon == "N"}예약{:else}접수{/if} 내용을 확인해 주세요.
  </h3>
  <div class="box_1">
    <dl class="info_dl">
      <dt>진료 방식</dt>
      {#if $dgnsType == "V" && $wlkYon == "N"}
        <dd>방문 예약</dd>
      {:else if $dgnsType == "U" && $wlkYon == "N"}
        <dd>비대면 예약</dd>
      {:else if $dgnsType == "V" && $wlkYon == "Y"}
        <dd>방문 접수</dd>
      {:else if $dgnsType == "U" && $wlkYon == "Y"}
        <dd>비대면 접수</dd>
      {/if}
      <dt>진료 대상</dt>
      <dd>{$treat_target}</dd>
      <dt>진료 병원</dt>
      <dd>{$treat_hspt}</dd>
      <dt>진료 항목</dt>
      <dd>{$treat_item}</dd>
      <dt>진료과</dt>
      <dd>{$treat_dept}</dd>
      <dt>의료진</dt>
      <dd>{$treat_dtr} 선생님</dd>
      <dt>일 시</dt>
      <dd>{dateString}</dd>
      <dt>남김말</dt>
      <dd>{$dgnsMemo}</dd>
    </dl>
  </div>
  <div class="btn_wrap inline">
    <button
      type="button"
      class="btn_03"
      on:click={() => {
        if ($wlkYon == "N") {
          goto(urlList.uaDgnsChng);
        } else {
          goto(urlList.uaDgnsTdChng);
        }
      }}
    >
      {#if $wlkYon == "N"}
        예약변경
      {:else}
        접수변경
      {/if}
    </button>
    <button type="button" class="btn_01" id="show" value="최종예약 되었습니다." on:click={doSecretNumReg}>
      {#if $wlkYon == "N"}
        최종예약하기
      {:else}
        최종접수하기
      {/if}
    </button>
  </div>
</section>
<!-- content E -->
{#if popUpWhat == "reg"}
  <PopUp {popUp}>
    <slot>
      {#if rgstStatus == true}
        {#if $wlkYon == "N"}
          최종예약 되었습니다.
        {:else}
          최종접수 되었습니다.
        {/if}
        <p>3초 뒤 자동으로 닫힙니다.</p>
      {:else}
        <p style="white-space: pre-wrap;">{message}</p>
      {/if}
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
      {#if rgstStatus == true}
        <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={() => goto(urlList.uaDgnsLst)}
          >예 ({secondsLeft})</button
        >
      {:else}
        <button
          type="button"
          class="mbtn_n_4"
          name="chbtn"
          id="close"
          on:click={() => {
            popUp = false;
            rgstStatus = false;
          }}>확인</button
        >
      {/if}
    </p>
    <p />
  </PopUp>
{/if}
{#if popUpWhat == "secretNum"}
  <PopUp {popUp}>
    <slot>
      주민등록번호 뒷자리를 입력해주세요.
      <button type="button" class="alert_close" on:click={closeSecretNum}><i class="xi-close-min" /></button>
    </slot>
    <br />
    <br />
    <div
      style="display: flex;
    justify-content: space-between;"
    >
      <input
        type="text"
        readonly
        style=" flex: 1;
    margin: 0 0.5em;"
        bind:value={dgnsBrth}
      />
      -
      <input
        type="text"
        style=" flex: 1;
    margin: 0 0.5em;"
        bind:value={maskedNum}
        on:input={handleSecretNum}
        maxlength="7"
      />
    </div>
    <br />
    <br />
    <br />
    <div>
      <p>아래 약관에 동의해 주세요</p>
      <br />
      <label class="none">
        <input type="checkbox" name id bind:checked={agree} />
        <span />
        [필수] 개인정보 처리방침
        <a href="https://sites.google.com/view/barodoctor-privacy-policy/%ED%99%88" style="color: blue;">[약관 링크]</a>
      </label>
    </div>
    <br />
    {#if text != ""}
      <div>
        <p style="color: red;">{text}</p>
        <br />
      </div>
    {/if}
    <p slot="btns" class="btn_wrap" id="btn">
      <button type="button" class="btn_01" id="show" value="최종예약 되었습니다." on:click={checkSecretNum}>
        {#if $wlkYon == "N"}
          최종예약하기
        {:else}
          최종접수하기
        {/if}
      </button>
    </p>
  </PopUp>
{/if}
