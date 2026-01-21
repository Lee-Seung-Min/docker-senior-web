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
  import {
    dgnsShpId,
    dgnsDtrId,
    dgnsMemo,
    dgnsRsvDttm,
    dgnsDeptId,
    dgnsItemId,
    dgnsType,
    treat_target,
    treat_hspt,
    treat_dept,
    treat_item,
    treat_dtr,
    childMount,
    wlkYon,
  } from "$lib/store/rgstStore.js";
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { searchDtrByDept } from "$lib/js/searchDtrByDept";
  import { searchTdDtrByDept } from "$lib/js/searchTdDtrByDept";
  import { chngDateHourFormat, getDow, getSecretNumFirstFormat } from "$lib/js/dateFunction";
  import DgnsLst from "../uaDgnsLst/DgnsLst.svelte";
  import { encrypt, getEncryptItems } from "$lib/js/aes256";
  import { slide } from "svelte/transition";
  let popUp = false;
  let popUpWhat = "";
  let famList = [];
  let deptList = [{ deptId: 0, deptName: "진료과 선택" }];
  let dtrList = [];
  let itemList = [{ itemId: 0, itemName: "진료항목 선택" }];
  let hspt = [];
  let shpId;
  let clOn;
  let comment = "";
  let dgnsChk = false;
  let hour;
  let who = "me";
  let dept = 0;
  let item = 0;
  let dtrNo = 0;
  let rghour = [{ htmeFrom: "", htmeTo: "" }];
  let dgnsMbrId;
  let text = "";
  let maskedNum;
  let regNumber;
  let agree = false;
  let dgnsBrth = "";
  let dgnsMbrRegNum = "";
  let encryptItems = [];
  let rgstStatus = false;
  let dateString;
  let timer;
  let countdown;
  let secondsLeft;
  let dgnsPatId;
  let jwt;
  let message;
  onMount(async () => {
    childMount.set(false); //비동기화 처리
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then((result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          dgnsMbrId = result;
          $footCheck = "menu1";
          $dgnsRsvDttm = "";
          loadFirst();
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
  async function loadFirst() {
    let dow = new Date();
    shpId = $page.url.searchParams.get("shpId");
    const familyUrl = /*urlAddr + "8083*/ authUrlAddr + "/v1/member/uaDgnsRgst?";
    let resData = await getAPI(familyUrl);
    famList = resData.resultVO;
    const hsptUrl =
      /*urlAddr + "8080*/ shopUrlAddr +
      "/v1/Shop/uaDgnsRgst?shpId=" +
      shpId +
      "&shpDay=" +
      dow.getDay() +
      "&dgnsType=" +
      $dgnsType;
    resData = await getAPI(hsptUrl);
    hspt = resData.resultVO.hspt[0];
    deptList = [...deptList, ...resData.resultVO.dept];
    if (deptList.length == 2) {
      dept = deptList[1].deptId;
      searchDtr();
    } else {
      dept = deptList[0].deptId;
    }
    itemList = [...itemList, ...resData.resultVO.item];

    item = itemList[0].itemId;
    childMount.set(true);
  }
  //예약 페이지 이동
  async function doReg() {
    // $dgnsRsvDttm = new Date();
    // console.log($dgnsRsvDttm);
    let currentDateTime = new Date();
    dateString = chngDateHourFormat(currentDateTime);
    if (who == "me") {
      dgnsPatId = 0;
    } else {
      dgnsPatId = famList.find(findWho).fmlyId;
    }
    let jsonStr = makeStr({
      dgnsShpId: shpId,
      dgnsDtrId: dtrList.find(findDtr).dtrId,
      dgnsMemo: comment,
      dgnsRsvDttm: dateString,
      dgnsDeptId: deptList.find(findDept).deptId,
      dgnsItemId: itemList.find(findItem).itemId,
      dgnsPatId,
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
        $dgnsType = "";
        $treat_target = "";
        $treat_hspt = "";
        $treat_dept = "";
        $treat_item = "";
        $treat_dtr = "";
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
    childMount.set(false);
  }

  async function doSecretNumReg() {
    //주민등록번호 인터페이스 생성 전까지 주석
    // getDgnsBrth();
    // if (who == "me") {
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
    if (who == "me") {
      let resData = await getAPI(authUrlAddr + "/v1/member/selectMemberInfo", jwt);
      dgnsBrth = getSecretNumFirstFormat(resData.mdtlBrth);
    }
    // else {
    //   let resData = await getAPI(authUrlAddr + "/v1/member/getFamilyInfo?id=" + $dgnsPatId);
    //   console.log(resData);
    //   dgnsBrth = getSecretNumFirstFormat(resData.fmlyBdte);
    // }
  }
  //일치하는 가족 id 찾기
  function findWho(e) {
    if (e.fmlyId == who) {
      return true;
    }
  }
  //일치하는 진료과 id 찾기
  function findDept(e) {
    if (e.deptId == dept) {
      return true;
    }
  }
  //일치하는 진료항목 찾기
  function findItem(e) {
    if (e.itemId == item) {
      return true;
    }
  }
  //일치하는 의사id 찾기
  function findDtr(e) {
    if (e.dtrId == dtrNo) {
      return true;
    }
  }
  //의사 예약 가능 시간 찾기
  async function findDtrTime() {
    let dow = new Date();
    const timeUrl =
      /*urlAddr +
      "8080*/ shopUrlAddr +
      "/v1/Shop/selectDoctorDgnsMobile?dtmeDtrId=" +
      dtrNo +
      "&htmeHsptId=" +
      shpId +
      "&htmeDay=" +
      dow.getDay() +
      "&dtmeType=" +
      $dgnsType +
      "&dtmeTime=" +
      dow.getHours() +
      ":" +
      dow.getMinutes();
    let resData = await getAPI(timeUrl); //의사&날짜 별 예약 가능 시간 찾기
    if (!resData.resultVO.dgnsOK) {
      popUpWhat = "blank" 
      text =
        "현재는 접수 가능한 시간이 아닙니다.<br>다른 의사를 선택하시거나,<br> 진료 가능한 시간에 다시 접수해 주세요.";
      popUp = true;
      clOn = -1;
      dtrNo = -1;
    } else {
      dgnsChk = true;
    }
    console.log(resData);
  }
  function xButton() {
    popUpWhat = "";
    popUp = false;
  }

  //진료과&진료항목 의사 찾기 -- 지금은 진료과로만 찾게
  async function searchDtr() {
    if (dept != 0) {
      dtrList = await searchTdDtrByDept(shpId, dept, $dgnsType);
      clOn = -1;
      dtrNo = -1;
      hour = "";
      rghour = [{ htmeFrom: "", htmeTo: "" }];
      if (dtrList.length == 1) {
        clOn = 0;
        dtrNo = dtrList[0].dtrId;
        findDtrTime();
      }
    }
    // searchItem(); //과에 따라 진료 항목
  }
  async function searchItem() {
    console.log("item");
    const hsptUrl =
      /*urlAddr + "8080*/ shopUrlAddr + "/v1/Shop/getItemListByDept?shpId=" + shpId + "&shpDeptId=" + dept;
    let resData = await getAPI(hsptUrl);
    itemList = itemList.slice(0, 1);
    itemList = [...itemList, ...resData.resultVO];
    console.log(resData);
    item = 0;
  }
  function getImg(imgUrl) {
    return "data:image/jpeg;base64," + imgUrl;
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

  let activeId = null;


  $: {
    if ($childMount && dept && dept !== 0) {
      searchDtr();
    }
  }

  // 헤더에 선택된 값을 표시하기 위한 반응형 변수들
  $: selectedPatientName = who === 'me' ? '본인' : famList.find(f => f.fmlyId === who)?.fmlyName;
  $: selectedDeptName = deptList.find(d => d.deptId === dept)?.deptName;
  $: selectedItemName = itemList.find(i => i.itemId === item)?.itemName;
  $: selectedDtrName = dtrList.find(d => d.dtrId === dtrNo)?.dtrName;

  function closeAccordion(param) {
    activeId = param;
  }

</script>

<!-- content S -->
<Nav>신규접수</Nav>
<div class="hos_info_top">
  <div class="box_hos">
    <div class="tit">
      <span>{hspt.shpName}</span>
    </div>
    <p class="dept">{hspt.shpDepts}</p>
  </div>
</div>
<section class="contents">
  <!-- 등록된 가족 표출 -->
  <div class="accordion-item" class:active={activeId === 'patient'}>
    <button class="accordion-header" on:click={() => activeId = (activeId === 'patient' ? null : 'patient')}>
      <span>진료대상 선택</span>
      {#if selectedPatientName}
        <span class="selected-text">{selectedPatientName}</span>
      {/if}
    </button>
    {#if activeId === 'patient'}
    <div class="accordion-content" transition:slide>
      <label>
        <input type="radio" name="patient-radio" value="me" bind:group={who} on:click={() => closeAccordion('department')}/>
        본인
      </label>
      {#each famList as fam}
      <label>
        <input type="radio" name="patient-radio" value={fam.fmlyId} bind:group={who} on:change={() => closeAccordion('department')}/>
        {fam.fmlyName}
      </label>
      {/each}
    </div>
    {/if}
  </div>

  <!-- 해당병원 진료과 표출 -->
  <div class="accordion-item" class:active={activeId === 'department'}>
    <button class="accordion-header" on:click={() => activeId = (activeId === 'department' ? null : 'department')}>
      <span>진료과 선택</span>
      {#if selectedDeptName && dept !== 0}
        <span class="selected-text">{selectedDeptName}</span>
      {/if}
    </button>
    {#if activeId === 'department'}
      <div class="accordion-content" transition:slide>
        {#each deptList.filter(d => d.deptId !== 0) as deptItem}
          <label>
            <input type="radio" name="dept-radio" value={deptItem.deptId} bind:group={dept} on:click={() => {  closeAccordion('item'); }}/>
            {deptItem.deptName}
          </label>
        {/each}
      </div>
    {/if}
  </div>

  <!-- 해당병원 진료항목 표출 -->
  <!-- 우선 진료항목 선택시 의사 바뀌는것 해제 -->
  <!-- <select name="" id="" bind:value={item} on:change={searchDtr}> -->
  <div class="accordion-item" class:active={activeId === 'item'}>
    <button class="accordion-header" on:click={() => activeId = (activeId === 'item' ? null : 'item')}>
      <span>진료항목 선택</span>
      {#if selectedItemName && item !== 0}
        <span class="selected-text">{selectedItemName}</span>
      {/if}
    </button>
    {#if activeId === 'item'}
      <div class="accordion-content" transition:slide>
        {#each itemList.filter(i => i.itemId !== 0) as itemData}
        <label>
          <input type="radio" name="item-radio" value={itemData.itemId} bind:group={item} on:click={() => closeAccordion('doctor')}/>
          {itemData.itemName}
        </label>
        {/each}
      </div>
    {/if}
  </div>

  <!-- 의료진 선택 -->
  <div class="accordion-item" class:active={activeId === 'doctor'}>
    <button class="accordion-header" on:click={() => activeId = (activeId === 'doctor' ? null : 'doctor')}>
      <span>의료진 선택</span>
      {#if selectedDtrName}
        <span class="selected-text">{selectedDtrName}</span>
      {/if}
    </button>
    {#if activeId === 'doctor'}
      <div class="accordion-content" transition:slide>
        <div class="box_1 onAction" style="padding: 10px 0;">
          {#if dtrList.length > 0}
            {#each dtrList as dtr, i}
              <button type="button" class={clOn == i ? "doctor on" : "doctor"}
                on:click={async () => {
                  clOn = i;
                  dtrNo = dtr.dtrId;
                  dgnsChk = true;
                  findDtrTime();
                  closeAccordion('memo'); // 선택 후 닫기
                  }}>
                {#if dtr.dtrImg != null && dtr.dtrImg != ""}
                  <img src={getImg(dtr.dtrImg)} class="img" alt="." />
                {:else if dtr.dtrGender == "F"}
                  <img src={new URL("$lib/img/barodoctor/doctor_6.png", import.meta.url).href} class="img" alt="." />
                {:else}
                  <img src={new URL("$lib/img/barodoctor/doctor_0.png", import.meta.url).href} class="img" alt="." />
                {/if}
                <div class="text">
                  <p class="name">{dtr.dtrName} 선생님</p>
                </div>
              </button>
            {/each}
          {:else}
            <p style="text-align:center; padding: 20px 0;">진료과를 먼저 선택해주세요.</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <div class="accordion-item" class:active={activeId === 'memo'}>
    <button class="accordion-header" on:click={() => activeId = (activeId === 'memo' ? null : 'memo')}>
      <span>진료 사유</span>
      {#if comment}
        <span class="selected-text preview">{comment}</span>
      {/if}
    </button>

    {#if activeId === 'memo'}
      <div class="accordion-content" transition:slide>
        <div class="box_1" style="padding: 10px;">
          <textarea name="" id="" placeholder="증상 또는 진료 내용" bind:value={comment}></textarea>
          <button type="button" class="btn_01 small" style="width:100%; margin-top: 10px;" on:click={() => closeAccordion(null)}>입력 완료</button>
        </div>
      </div>
    {/if}
  </div>

  <div style="padding:50px" />
  <div class="bottom_btn_fixed">
    <button
      type="button"
      class="newReg"
      on:click={() => {
        popUpWhat = "blank";
        if (dept == 0) {
          text = "진료과를 선택해주세요";
          popUp = true;
        } else if (item == 0) {
          text = "진료항목을 선택해주세요";
          popUp = true;
        } else if (!dgnsChk) {
          text = "의사를 선택해주세요";
          popUp = true;
        } else {
          popUpWhat = "";
          doSecretNumReg();
        }
      }}>접수하기</button
    >
  </div>
</section>
<!-- content E -->
{#if popUpWhat == "blank"}
  <PopUp {popUp}>
    <slot>
      {@html text}
      <button type="button" class="alert_close" style="margin: 6px" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <p slot="btns" class="btn_wrap" id="btn">
      <button type="button" class="mbtn_n_9" name="chbtn" id="close" on:click={xButton}>닫기</button>
    </p>
  </PopUp>
{/if}
{#if popUpWhat == "reg"}
  <PopUp {popUp}>
    <slot>
      {#if rgstStatus == true}
        최종접수 되었습니다.
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
        최종접수하기
      </button>
    </p>
  </PopUp>
{/if}

<style>
    .accordion-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: white;
    margin-bottom: 12px;
    overflow: hidden; /* transition과 border-radius 충돌 방지 */
}
.accordion-header {
    width: 100%;
    background: none;
    border: none;
    padding: 16px;
    font-size: 1.1em;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #333;
}
.accordion-header::after {
    content: '▼';
    font-size: 0.7em;
    color: #999;
    transition: transform 0.2s ease;
}
.accordion-item.active .accordion-header {
    border-bottom: 1px solid #e0e0e0;
}
.accordion-item.active .accordion-header::after {
    transform: rotate(180deg);
}
.accordion-content {
    padding: 8px 16px;
    background-color: #fdfdfd;
}
.accordion-content label {
    display: block;
    padding: 12px 0;
    cursor: pointer;
}
.accordion-content input[type="radio"] {
    margin-right: 8px;
}
.selected-text {
    color: #007bff;
    font-weight: normal;
    font-size: 0.9em;
    margin-left: auto;
    padding-right: 1rem;
    max-width: 50%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.selected-text.preview {
    font-style: italic;
}
.btn_01.small {
    padding: 8px 12px;
    font-size: 0.9em;
}
</style>