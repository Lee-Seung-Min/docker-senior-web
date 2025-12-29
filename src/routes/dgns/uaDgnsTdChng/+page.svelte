<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { page } from "$app/stores";
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
    wlkYon,
  } from "$lib/store/rgstStore.js";
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
  let dgnsChk = true;
  let text = "";
  let clOn;
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { searchTdDtrByDept } from "$lib/js/searchTdDtrByDept";
  import { getDow } from "$lib/js/dateFunction";
  onMount(async () => {
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
    clOn = dtrList.findIndex((dtr) => dtr.dtrId == dtrNo);
    childMount.set(true);
  }

  //수정한 내용 갖고 uaDgnsChk로 이동
  function doReg() {
    day = new Date();
    $dgnsRsvDttm = day;
    console.log($dgnsRsvDttm);
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
    let dow = new Date();
    const timeUrl =
      /*urlAddr +
      "8080*/ shopUrlAddr +
      "/v1/Shop/selectDoctorDgnsMobile?dtmeDtrId=" +
      dtrNo +
      "&htmeHsptId=" +
      $dgnsShpId +
      "&htmeDay=" +
      dow.getDay() +
      "&dtmeType=" +
      $dgnsType +
      "&dtmeTime=" +
      dow.getHours() +
      ":" +
      dow.getMinutes();
    let resData = await getAPI(timeUrl); //의사&날짜 별 예약 가능 시간 찾기
    console.log(resData);
    if (!resData.resultVO.dgnsOK) {
      text = "접수가 마감되었습니다.";
      popUp = true;
      dgnsChk = false;
      clOn = -1;
    } else {
      dgnsChk = true;
    }
  }

  //닫기 버튼
  function xButton() {
    popUp = false;
  }

  //진료과&진료항목 의사 찾기  -- 지금은 진료과로만 찾게
  async function searchDtr() {
    if (dept != 0) {
      dtrList = await searchTdDtrByDept($dgnsShpId, dept, $dgnsType);
      clOn = -1;
      dtrNo = -1;
      hour = "";
      if (dtrList.length == 0) {
        text = "접수 가능한 의사가 없습니다.";
        popUp = true;
        dgnsChk = false;
      }
      console.log(dtrList);
    }
    // searchItem(); //과에 따라 진료 항목
  }
  async function searchItem() {
    console.log("item");
    const hsptUrl =
      /*urlAddr + "8080*/ shopUrlAddr + "/v1/Shop/getItemListByDept?shpId=" + $dgnsShpId + "&shpDeptId=" + dept;
    let resData = await getAPI(hsptUrl);
    itemList = resData.resultVO;
    console.log(resData);
  }
</script>

<!-- content S -->
<Nav>진료접수 수정</Nav>

<section class="contents">
  <h3 class="big">진료접수 내용을 수정해 주세요.</h3>
  <form action="">
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
          <div class="box_1 onAction">
            {#each dtrList as dtr, i}
              <button
                type="button"
                class={clOn == i ? "tddoctor on" : "tddoctor"}
                on:click={() => {
                  clOn = i;
                  dtrNo = dtr.dtrId;
                  findDtrTime();
                }}
              >
                <div class="text">
                  <p class="name">{dtr.dtrName} 선생님</p>
                  <p>진료분야 : {dtr.dtrDepts}</p>
                  <p style="font-weight: 800;">
                    {getDow()}요일
                    {#if $dgnsType == "U"}
                      비대면
                    {:else}
                      대면
                    {/if}
                    진료시간
                  </p>
                  {#if dtr.dgnsTime.length != 0}
                    {#each dtr.dgnsTime as dt}
                      <p>
                        {dt.htmeFrom} ~ {dt.htmeTo}
                      </p>
                    {/each}
                  {:else}
                    <p style="color: red;">휴무</p>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </dd>
        <dt>진료 사유</dt>
        <dd><textarea name="" id="" placeholder="증상 또는 진료 내용" bind:value={comment} /></dd>
      </dl>
    </div>

    <div class="btn_wrap inline">
      <button
        type="button"
        class="btn_02"
        on:click={() => {
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
            doReg();
          }
        }}>변경하기</button
      >
    </div>
  </form>
</section>
<!-- content E -->

<PopUp {popUp}>
  <slot>
    {text}
    <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
  </slot>
  <p slot="btns" class="btn_wrap" id="btn">
    <button type="button" class="mbtn_n_9" name="chbtn" id="close" on:click={xButton}>닫기</button>
  </p>
</PopUp>
