<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import Daum from "svelte-daum-postcode";
  import { postAPI } from "$lib/js/postAPI";
  import { page } from "$app/stores";
  import { deleteAPI } from "$lib/js/deleteAPI";
  import { authUrlAddr } from "$lib/js/urlAddr";

  /**
   * 이전 페이지에서 가져온 배송지id
   */
  const id = $page.url.searchParams.get("id");

  const jwt = localStorage.getItem("userJwt");

  let name = "";
  let phoneNum = "";
  let addNum = "";
  let add = "";
  let addDetail = "";

  let popUp = false;
  let errorType = "";
  let selectPopUp = "";

  let isUpdate = true;
  let addToggle = false;

  let pspn = "";
  let type = "";
  onMount(async () => {
    pspn = $page.url.searchParams.get("pspn");
    if (id != -1) {
      const url = authUrlAddr + "/v1/member/selectSingleMemberDelivery?id=" + id;
      let result = await getAPI(url);
      name = result.dlstName;
      phoneNum = result.dlstTel;
      addNum = result.dlstZip;
      add = result.dlstAddr;
      addDetail = result.dlstAddrDtl;
    }
  });

  /**
   * 다음 주소검색에서 선택을 완료한 뒤에 결과값을 input박스에 추가하는 함수
   * @param data 선택한 주소결과값
   */
  function addComplete({ detail: { data } }) {
    addNum = data.zonecode;
    add = data.address;
    addToggle = false;
  }

  /**
   * 새로운 배송지를 신규저장 또는 수정하는 함수
   * id가 있다면 수정으로 아니라면 신규저장으로 진행됨
   */
  async function insertDlv() {
    if (name == "") {
      errorType = "이름";
      selectPopUp = "error";
      popUp = true;
      return;
    } else if (addNum == "" || add == "" || addDetail == "") {
      errorType = "주소";
      selectPopUp = "error";
      popUp = true;
    }

    let url = "";
    const data = {
      dlstId: id,
      dlstName: name,
      dlstZip: addNum,
      dlstAddr: add,
      dlstAddrDtl: addDetail,
      dlstTel: phoneNum,
      dlstDftYon: id == -1 ? "N" : "",
    };
    if (id == -1) {
      url = authUrlAddr + "/v1/member/insertMemberDeliveryInfo";
    } else {
      url = authUrlAddr + "/v1/member/updateMemberDeliveryInfo";
    }
    try {
      let result = await postAPI(url, JSON.stringify(data), jwt);
      console.log(result);
      if (result.message == "OK.") {
        if (pspn == "true") {
          type = $page.url.searchParams.get("type");
          goto(urlList.uaDlvRgst + "?type=" + type);
        } else {
          goto(urlList.uaDlvPlcLst);
        }
      } else {
        isUpdate = true;
        selectPopUp = "fail";
        popUp = true;
      }
    } catch (error) {
      console.error(error);
      isUpdate = true;
      selectPopUp = "fail";
      popUp = true;
    }
  }

  /**
   * 배송지 삭제하는 함수
   * 삭제 성공하면 배송지 목록페이지로 이동
   * 아니라면 실패 메시지 보여줌
   */
  async function deleteDlv() {
    try {
      const url = authUrlAddr + "/v1/member/deleteMemberDeliveryInfo";
      let result = await deleteAPI(url, JSON.stringify({ dlstId: id }));

      if (result > 0) {
        goto(urlList.uaDlvPlcLst);
      } else {
        isUpdate = false;
        selectPopUp = "fail";
        popUp = true;
      }
    } catch (error) {
      console.error(error);
      isUpdate = false;
      selectPopUp = "fail";
      popUp = true;
    }
  }

  /**
   * 휴대폰 번호 형식을 맞춰주는 함수
   */
  function phoneBlur() {
    phoneNum = phoneNum.replace(/\D/g, "");

    if (phoneNum.length == 11) {
      phoneNum = phoneNum.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    }
  }
</script>

<Nav
  >배송지 {#if id == -1}등록{:else}수정{/if}</Nav
>
<section class="contents">
  <div class="form_wrap">
    <label>
      <input type="text" required id name bind:value={name} />
      <span>이름</span>
    </label>

    <label>
      <input type="text" required id name bind:value={phoneNum} on:blur={phoneBlur} maxlength="11" />
      <span>휴대번호</span>
    </label>

    <label>
      <input type="number" required id name bind:value={addNum} maxlength="8" />
      <span>우편번호</span>
      <button class="mbtn_n" on:click={() => (addToggle = !addToggle)}>주소 찾기</button>
    </label>

    {#if addToggle}
      <div>
        <Daum height="500px" autoClose="true" on:complete={addComplete} />
      </div>
    {/if}

    <label class="add" style="margin-top: 0">
      <input type="text" required id name placeholder="기본주소" bind:value={add} maxlength="30" />
    </label>

    <label class="add" style="margin-top: 0">
      <input type="text" required id name placeholder="상세주소" bind:value={addDetail} maxlength="100" />
    </label>
    <button class="btn_01" style="margin-top: 10px" on:click={() => insertDlv()}>
      배송지 {#if id == -1}등록{:else}수정{/if}
    </button>
    {#if id != -1}
      <button class="btn_01" style="margin-top: 10px" on:click={() => deleteDlv()}>배송지 삭제</button>
    {/if}
  </div>
</section>

{#if selectPopUp == "fail"}
  <PopUp {popUp}>
    <slot>
      <h2>
        {#if isUpdate}수정{:else}삭제{/if} 실패
      </h2>
      <br />{#if isUpdate}수정{:else}삭제{/if} 중 오류가 발생했습니다.
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
{:else if selectPopUp == "error"}
  <PopUp {popUp}>
    <slot>
      <h2>
        {#if isUpdate}수정{:else}삭제{/if} 실패
      </h2>
      <br />
      {#if (errorType = "이름")}
        이름을 입력해주세요.
      {:else if (errorType = "주소")}
        주소를 정확히 입력해주세요.
      {/if}
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
  </PopUp>{/if}
