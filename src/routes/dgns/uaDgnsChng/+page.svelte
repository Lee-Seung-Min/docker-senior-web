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
  import Calendar from "$lib/sub/Calendar.svelte";
  import { footCheck } from "$lib/store/navStore.js";
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
  } from "$lib/store/rgstStore.js";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { searchDtrByDept } from "$lib/js/searchDtrByDept";
  import { chngDateFormat, chngDateHourFormat } from "$lib/js/dateFunction";
  let popUp = false;
  let popUpWhat = "";
  let deptList = [];
  let dtrList = [];
  let itemList = [];
  let comment = "";
  let day;
  let hour;
  let dept = 0;
  let item = 0;
  let dtrNo = 0;
  let rghour = [{ htmeFrom: "", htmeTo: "" }];
  let dgnsId;
  let jwt;
  let text = "";
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    dgnsId = $page.url.searchParams.get("dgnsId");
    childMount.set(false); //비동기 실행으로 추가
    $footCheck = "menu1";
    loadFirst();
  });
  //진료과, 의사, 진료항목, 메모 리스트 가져오기
  async function loadFirst() {
    const hsptUrl = /*urlAddr + "8080*/ shopUrlAddr + "/v1/Shop/uaDgnsRgst?shpId=" + $dgnsShpId;
    let resData = await getAPI(hsptUrl);
    deptList = resData.resultVO.dept;
    itemList = resData.resultVO.item;
    comment = $dgnsMemo;
    dept = $dgnsDeptId;
    item = $dgnsItemId;
    await searchDtr();
    dtrNo = $dgnsDtrId;
    childMount.set(true);
  }

  //수정한 내용 갖고 uaDgnsChk로 이동
  function doReg() {
    day = new Date(day);
    let time = hour.split(":");
    day.setHours(time[0], time[1]);
    $dgnsRsvDttm = day;
    $treat_dept = deptList.find(findDept).deptName;
    $dgnsDeptId = deptList.find(findDept).deptId;
    $treat_item = itemList.find(findItem).itemName;
    $dgnsItemId = itemList.find(findItem).itemId;
    $treat_dtr = dtrList.find(findDtr).dtrName;
    $dgnsDtrId = dtrList.find(findDtr).dtrId;
    $dgnsMemo = comment;
    childMount.set(false);
    goto(urlList.uaDgnsChk);
  }

  //진료 과 찾기
  function findDept(e) {
    if (e.deptId == dept) {
      return true;
    }
  }

  //진료 항목 찾기
  function findItem(e) {
    if (e.itemId == item) {
      return true;
    }
  }

  //진료 의사 찾기
  function findDtr(e) {
    if (e.dtrId == dtrNo) {
      return true;
    }
  }
  //의사 예약 가능 시간 찾기
  async function findDtrTime() {
    let dow = new Date(day);
    const timeUrl =
      /*urlAddr +
      "8080*/ shopUrlAddr +
      "/v1/Shop/uaDgnsDtrTm?dtmeDtrId=" +
      dtrNo +
      "&htmeHsptId=" +
      $dgnsShpId +
      "&htmeDay=" +
      dow.getDay() +
      "&dtmeType=" +
      $dgnsType +
      "&dtmeDay=" +
      day;
    let resData = await getAPI(timeUrl); //의사&날짜 별 예약 가능 시간 찾기
    if (resData.resultVO.length != 0) {
      if (resData.resultVO[0].htmeType == "vacation") {
        hour = "vacation";
        rghour = [{ htmeFrom: "", htmeTo: "" }];
      } else {
        rghour = resData.resultVO;
        hour = rghour[0].htmeFrom;
        // todayTm(dow, hour);
      }
    } else {
      hour = "";
      rghour = [{ htmeFrom: "", htmeTo: "" }];
    }
  }

  //수정 내역 업데이트
  async function update() {
    popUp = false;
    const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/dgns/updateDgnsRsv";
    day = new Date(day);
    let time = hour.split(":");
    day.setHours(time[0], time[1]);
    //yy.mm.dd hh24:mi 형식으로 변경
    let dateString = chngDateHourFormat(day);

    let jsonStr = makeStr({
      dgnsDtrId: dtrList.find(findDtr).dtrId,
      dgnsMemo: comment,
      dgnsRsvDttm: dateString,
      dgnsDeptId: deptList.find(findDept).deptId,
      dgnsItemId: itemList.find(findItem).itemId,
      dgnsId,
    });
    let res = await postAPI(url, jsonStr, jwt);
    if (res.resultVO == true) {
      //store 초기화
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
      $childMount = "";
      childMount.set(false);
      popUpWhat = "updateChange";
      popUp = true;
    }
  }

  //닫기 버튼
  function xButton() {
    popUp = false;
  }

  function areDatesEqual(date1, date2) {
    // 년, 월, 일을 비교하여 오늘인지 아닌지
    const isSameYear = date1.getFullYear() === date2.getFullYear();
    const isSameMonth = date1.getMonth() === date2.getMonth();
    const isSameDay = date1.getDate() === date2.getDate();

    // 년, 월, 일이 모두 동일한지 확인
    if (isSameYear && isSameMonth && isSameDay) {
      return true; // 동일한 날짜
    } else {
      return false; // 다른 날짜
    }
  }

  //오늘 선택시 과거 시간 선택 불가하게
  function todayTm(dow, chkHour) {
    if (areDatesEqual(dow, new Date())) {
      let now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      rghour = rghour.filter((obj) => {
        const hour = parseInt(obj.htmeFrom.split(":")[0]);
        const minute = parseInt(obj.htmeFrom.split(":")[1]);
        return hour > currentHour || (hour === currentHour && minute > currentMinute);
      });
      if (rghour.length == 0) {
        hour = "";
      } else if (chkHour < rghour[0].htmeFrom) {
        hour = rghour[0].htmeFrom;
      }
    }
  }

  //진료과&진료항목 의사 찾기  -- 지금은 진료과로만 찾게
  async function searchDtr() {
    if (dept != 0) {
      dtrList = await searchDtrByDept($dgnsShpId, dept, $dgnsType);
      dtrNo = -1;
      hour = "";
      rghour = [{ htmeFrom: "", htmeTo: "" }];
    }
    // searchItem(); //과에 따라 진료 항목
  }

  async function searchItem() {
    const hsptUrl =
      /*urlAddr + "8080*/ shopUrlAddr + "/v1/Shop/getItemListByDept?shpId=" + $dgnsShpId + "&shpDeptId=" + dept;
    let resData = await getAPI(hsptUrl);
    itemList = resData.resultVO;
  }
</script>

<!-- content S -->
<Nav>진료예약 수정</Nav>

<section class="contents">
  <h3 class="big">진료예약 내용을 수정해 주세요.</h3>
  <form action="">
    <div class="box_1">
      <dl class="info_dl">
        <dt>진료 방식</dt>
        {#if $dgnsType == "V"}
          <dd>방문 예약</dd>
        {:else}
          <dd>비대면 예약</dd>
        {/if}
        <dt>진료 대상</dt>
        <dd>{$treat_target}</dd>
        <dt>진료 병원</dt>
        <dd>{$treat_hspt}</dd>
        <dt>진료과</dt>
        <dd>
          <div class="select_wrap">
            <select name="" id="" bind:value={dept} on:change={searchDtr}>
              {#each deptList as dept}
                <option value={dept.deptId}>{dept.deptName}</option>
              {/each}
              <!-- 해당병원 진료과 표출 -->
            </select>
          </div>
        </dd>
        <dt>진료 항목</dt>
        <dd>
          <div class="select_wrap">
            <!-- 우선 진료항목 선택시 의사 바뀌는것 해제 -->
            <!-- <select name="" id="" bind:value={item} on:change={searchDtr}> -->
            <select name="" id="" bind:value={item}>
              {#each itemList as item}
                <option value={item.itemId}>{item.itemName}</option>
              {/each}
              <!-- 해당병원 진료항목 표출 -->
            </select>
          </div>
        </dd>
        <dt>의료진</dt>
        <dd>
          <div class="select_wrap">
            <select name="" id="" bind:value={dtrNo} on:change={findDtrTime}>
              {#each dtrList as dtr}
                <option value={dtr.dtrId}>{dtr.dtrName} 선생님</option>
              {/each}
              <!-- 해당병원 의료진 표출 -->
            </select>
          </div>
        </dd>
        <dt class="wide">일 시</dt>
        <dd class="wide">
          <Calendar bind:day bind:hour bind:dtrNo bind:rghour />
        </dd>
        <dt>예약 사유</dt>
        <dd><textarea name="" id="" placeholder="증상 또는 진료 내용" bind:value={comment} /></dd>
      </dl>
    </div>

    <div class="btn_wrap inline">
      <button
        type="button"
        class="btn_02"
        on:click={() => {
          if (hour == "" && rghour[0].htmeFrom == "holiday" && rghour[0].htmeTo == "") {
            text = "병원휴무입니다. 다른 날짜를 선택해주세요";
            popUpWhat = "fail";
            popUp = true;
          } else if (hour == "") {
            text = "시간을 선택해주세요";
            popUpWhat = "fail";
            popUp = true;
          } else if (hour == "vacation") {
            text = "병원휴가입니다. 다른 날짜를 선택해주세요";
            popUpWhat = "fail";
            popUp = true;
          } else {
            if (dgnsId == null) {
              doReg();
            } else {
              popUpWhat = "update";
              popUp = true;
            }
          }
        }}>변경하기</button
      >
    </div>
  </form>
</section>
<!-- content E -->
{#if popUpWhat == "fail"}
  <PopUp {popUp}>
    <slot>
      {text}
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <p slot="btns" class="btn_wrap" id="btn">
      <button type="button" class="mbtn_n_9" name="chbtn" id="close" on:click={xButton}>닫기</button>
    </p>
  </PopUp>
{:else if popUpWhat == "update"}
  <PopUp {popUp}>
    <slot
      >예약 변경 하시겠습니까?
      <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
    </slot>
    <p slot="btns" class="btn_wrap" id="btn">
      <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={update}>예</button>
      <button type="button" class="mbtn_n_9" name="chbtn" id="close" on:click={xButton}>아니오</button>
    </p>
  </PopUp>
{:else if popUpWhat == "updateChange"}
  <PopUp {popUp}>
    <slot>
      예약 변경 되었습니다.
      <button
        type="button"
        class="alert_close"
        on:click={() => {
          goto(urlList.uaDgnsDtl + "?dgnsId=" + dgnsId);
        }}><i class="xi-close-min" /></button
      >
    </slot>
    <p slot="btns" class="btn_wrap" id="btn">
      <button
        type="button"
        class="mbtn_n_9"
        name="chbtn"
        id="close"
        on:click={() => {
          goto(urlList.uaDgnsDtl + "?dgnsId=" + dgnsId);
        }}>닫기</button
      >
    </p>
  </PopUp>
{/if}
