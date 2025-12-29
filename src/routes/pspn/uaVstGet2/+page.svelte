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
  import { drcpShpId, drcpPspnId } from "$lib/store/pspnStore.js";
  import { getUserId } from "$lib/js/getUserId";
  import { pharmacyData } from "$lib/store/pharmacyData";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import PspnPopUp from "$lib/sub/nav/PspnPopUp.svelte";
  import PageLoader from "$lib/sub/PageLoader.svelte";
  let popUp = false;
  let patient = [];
  let jwt;
  var week = 0;
  let estimateVisitDay;
  let estimateVisitTime;
  let data = {};
  let patientText;
  let mbrId;
  let substituteName;
  let substitutePhone = "";
  let substituteRelation;
  let message;
  let popUpWhat;
  let familyTypes = [
    { type: "부모" },
    { type: "배우자" },
    { type: "자녀" },
    { type: "형제,자매" },
    { type: "조모조부" },
    { type: "손자손녀" },
    { type: "조카" },
    { type: "삼촌이모" },
    { type: "기타" },
  ];
  let typeselected = 0;
  let noData = false;
  let oneClick = true;
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          const url = mobileUrlAddr + "/v1/dgns/selectMbrInfoForPpds?drcpPspnId=" + $drcpPspnId;
          let resData = await getAPI(url);
          patient = resData.resultVO;
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
    // const url = /*urlAddr + "8080*/ "/shop/v1/Shop/uaVstGet?shpId=" + $drcpShpId;
    // let resData = await getAPI(url);
    // visit = resData.resultVO;
    data = $pharmacyData;
    console.log(data);
    week = getWeekOfMonth(new Date()) - 1;
    estimateVisitDay = new Date().toISOString().slice(0, 10);
    estimateVisitTime = new Date().toTimeString().slice(0, 5);
  });
  function visitPopUP() {
    popUp = true;
    popUpWhat = "pspn";
  }
  //팝업 닫기
  function xButton() {
    popUp = false;
  }
  async function addVst() {
    // let jsonStr = makeStr({ drcpPspnId: $drcpPspnId, drcpShpId: $drcpShpId, drcpStat: 1, drcpDlvType: "V" });
    // const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/dgns/insertDrcpInfo";
    // let res = await postAPI(url, jsonStr, jwt);
    // if (res.resultVO == true) {
    //   popUp = false;
    //   $drcpPspnId = "";
    //   $drcpShpId = "";
    //   goto(urlList.uaPspnLst);
    // }
    if (oneClick) {
      oneClick = false;
      popUpWhat = "";
      const url = shopUrlAddr + "/v1/ppds/reqPatientPrescription";
      let jsonStr = makeStr({
        patientPrescription: {
          pharmacyCode: $pharmacyData.pharmacyCode,
          platformUserCode: mbrId,
          name: patient.name,
          phone: formatPhoneNumber(patient.phone),
          birthday: formatDate(patient.birthday),
          gender: patient.gender, //추후 수정
          prescriptions: [{ platformPrescriptionCode: $drcpPspnId }],
          patientText,
          estimateVisitDay: formatDate(estimateVisitDay),
          estimateVisitTime,
          deliveryType: "2",
          substituteName,
          substitutePhone: formatPhoneNumber(substitutePhone),
          substituteRelation: typeselected + 1,
        },
        pharmacy: {
          pharmacyCode: $pharmacyData.pharmacyCode,
          name: $pharmacyData.name,
          address1: $pharmacyData.address1,
          address2: $pharmacyData.address2,
          coordinateY: $pharmacyData.coordinateY,
          coordinateX: $pharmacyData.coordinateX,
          phone: $pharmacyData.phone,
        },
      });
      console.log(jsonStr);
      let res = await postAPI(url, jsonStr);
      console.log(res);
      if (res.code == 200) {
        popUpWhat = "response";
        message = "처방전을 전송하였습니다.";
        oneClick = true;
      } else {
        popUpWhat = "response";
        message = res.message;
      }
    }
  }

  function getWeekOfMonth(date) {
    var firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    var firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay();
    var offsetDate = date.getDate() + firstDayOfWeek - 1;
    return Math.ceil(offsetDate / 7);
  }
  function formatDate(date) {
    return date.replaceAll("-", "");
  }
  function getMinDate() {
    const datepicker = document.getElementById("wrtDate");

    // 현재 날짜 가져오기
    const currentDate = new Date();

    // datepicker의 최소 날짜를 현재 날짜로 설정
    datepicker.setAttribute("min", currentDate.toISOString().split("T")[0]);
  }
  // patient.phone 값이 변경될 때마다 호출될 함수
  function handlePhoneInput(event) {
    event.target.value = formatPhoneNumber(event.target.value);
  }

  function formatPhoneNumber(phoneNumber) {
    // 숫자만 추출
    var digits = phoneNumber.replace(/\D/g, "");

    // 숫자가 11자리가 아니면 원래 번호를 반환
    if (digits.length !== 11) {
      return phoneNumber;
    }

    // '010-0000-0000' 형식으로 변환
    return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  function getLaucnTime(e) {
    let openTime = "";
    if (e.startTime != null && e.startTime != "") {
      openTime = e.startTime.slice(0, 5) + " ~ " + e.endTime.slice(0, 5);
    }
    return openTime;
  }
  function isPhone(phoneNumber) {
    // 숫자만 추출
    var digits = phoneNumber.replace(/\D/g, "");

    // 숫자가 11자리가 아니면 원래 번호를 반환
    if (digits.length !== 11) {
      return false;
    } else {
      return true;
    }
  }
</script>

<Nav>본인수령</Nav>
<section class="contents">
  <h3 class="big">약국 정보​</h3>

  <div class="box_1">
    <dl class="info_dl">
      <dt class="tit">약국명</dt>
      <dd>{data.shpName}</dd>

      <dt class="tit">약국주소</dt>
      <dd>{data.sdtlAddr} {data.sdtlAddrDtl == undefined ? "" : data.sdtlAddrDtl}</dd>
      <dt class="tit">전화번호</dt>
      <dd>{data.sdtlTel}</dd>
      <dt class="tit">영업시간</dt>
      <dd>
        {data.startTime} ~ {data.endTime}
      </dd>
    </dl>
  </div>

  <div class="btn_wrap inline">
    <button type="button" class="btn_01" value="방문수령 하시겠습니까?" id="show" on:click={visitPopUP}>신청하기</button
    >
  </div>
</section>
<!-- content E -->
{#if popUpWhat == "pspn"}
  <PspnPopUp {popUp}>
    <slot
      >처방전 전송 하시겠습니까? <button type="button" class="alert_close" on:click={xButton}
        ><i class="xi-close-min" /></button
      ></slot
    >
    <dl class="info_dl" slot="btns">
      <dt>환자 이름</dt>
      <dd>{patient.name}</dd>
      <dt>환자 생년월일</dt>
      <dd>{patient.birthday}</dd>
      <dt>환자 연락처</dt>
      <dd><input type="text" bind:value={patient.phone} on:input={handlePhoneInput} /></dd>
      <dt>대리자명</dt>
      <dd><input type="text" bind:value={substituteName} /></dd>
      <dt>대리자 연락처</dt>
      <dd><input type="text" bind:value={substitutePhone} on:input={handlePhoneInput} /></dd>
      <dt>환자와 대리자의 관계</dt>
      <dd>
        <select name id bind:value={typeselected}>
          {#each familyTypes as familyType, i}
            <option value={i}>{familyType.type}</option>
          {/each}
        </select>
      </dd>
      <dt>예상방문일</dt>
      <dd><input type="date" bind:value={estimateVisitDay} id="wrtDate" on:click={getMinDate} /></dd>
      <dt>예상 방문 수령 시간</dt>
      <dd><input type="time" bind:value={estimateVisitTime} /></dd>
      <dt>환자 요청사항</dt>
      <dd><input type="text" bind:value={patientText} /></dd>
    </dl>
    <p class="btn_wrap" id="btn" slot="btns_h">
      <button
        type="button"
        class="mbtn_n_4"
        name="chbtn"
        on:click={() => {
          if (substituteName == "" || substituteName == null) {
            noData = true;
            message = "대리인을 입력해주세요";
            console.log(111);
          } else if (!isPhone(substitutePhone)) {
            noData = true;
            message = "대리인 전화번호를 입력해주세요";
          } else {
            addVst();
          }
        }}
        id="close">예</button
      >
      <button type="button" class="mbtn_n_9" id="close" on:click={xButton}>아니오</button>
    </p>
    <p />
  </PspnPopUp>
  {#if noData == true}
    <PopUp {popUp}>
      <slot>
        <p style="white-space: pre-wrap;">{message}</p>
      </slot>
      <p class="btn_wrap" id="btn" slot="btns">
        <button
          type="button"
          class="mbtn_n_4"
          name="chbtn"
          id="close"
          on:click={() => {
            noData = false;
          }}>확인</button
        >
      </p>
      <p />
    </PopUp>
  {/if}
{:else if popUpWhat == "response"}
  <PopUp {popUp}>
    <slot>
      <p style="white-space: pre-wrap;">{message}</p>
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
      <button
        type="button"
        class="mbtn_n_4"
        name="chbtn"
        id="close"
        on:click={() => {
          popUp = false;
          $drcpPspnId = "";
          $pharmacyData = null;
          goto(urlList.uaPspnLst);
        }}>확인</button
      >
    </p>
    <p />
  </PopUp>
{:else if !oneClick}
  <PageLoader></PageLoader>
{/if}
