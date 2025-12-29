<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import PopUp from "$lib/sub/nav/PopUp.svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import Daum from "svelte-daum-postcode";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { postAPI } from "$lib/js/postAPI";
  import { deleteAPI } from "$lib/js/deleteAPI";
  import { page } from "$app/stores";
  import { authUrlAddr } from "$lib/js/urlAddr";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { makeStr } from "$lib/js/makeStr";

  /**
   * 이전 페이지에서 가져온 가족id
   */
  const id = $page.url.searchParams.get("id");

  let jwt = "";
  let refresh = "";

  //생일, 휴대전화 정규식
  let birthdayReg = /^(19[0-9][0-9]|20\d{2}).(0[0-9]|1[0-2]).(0[1-9]|[1-2][0-9]|3[0-1])/;
  let phoneReg = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}/;
  //에러메시지 종류
  let regError = "";

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
  let typeselected = "부모";
  let name = "";
  let gender = "M";
  let birthday = "";
  let tel = "";
  let addNum = "";
  let add = "";
  let addDetail = "";
  let agree = false;

  let addToggle = false; //daum 주소찾기 창을 위한 토글변수
  let addDetailInput; //세부주소 input 포커스를 위한 변수

  let popUp = false; //팝업창 토글변수

  let selectPopup = "";

  /**
   * 페이지가 로딩될때 가족 리스트를 가져온다
   */
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    refresh = localStorage.getItem("refreshJwt");
    try {
      if (id != -1) {
        const url = authUrlAddr + "/v1/member/getFamilyInfo?id=" + id;
        let result = await getAPI(url);

        typeselected = result.fmlyType;
        name = result.fmlyName;
        gender = result.fmlyGndr == null ? "M" : result.fmlyGndr; //null값이면 M 디폴트로 설정함
        birthday = result.fmlyBdte;
        tel = result.fmlyTel;
        addNum = result.fmlyZip;
        add = result.fmlyAddr;
        addDetail = result.fmlyAddrDtl;
        agree = result.fmlyAgreYon == "Y" ? true : false;
      }
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
        goto(urlList.uaLogin);
      }
    }
  });

  /**
   * 신규 가족이라면 신규등록을, 아니라면 기존 가족 데이터를 수정한다.
   * 이때 기존 데이터를 수정하는 것이라면, 삭제 후 신규등록되는 것으로 로직이 처리된다.
   */
  async function insertFamily() {
    let url = "";
    //맞지않은 형식의 생년월일
    if (name == "") {
      regError = "이름";
      selectPopup = "error";
      popUp = true;
      return;
    } else if (!birthdayReg.test(birthday)) {
      regError = "생년월일";
      selectPopup = "error";
      popUp = true;
      return;
    } else if (!phoneReg.test(tel) && tel != "") {
      //맞지않은 형식의 휴대폰번호
      regError = "휴대번호";
      selectPopup = "error";
      popUp = true;
      return;
    } else if (!agree) {
      regError = "미동의";
      selectPopup = "error";
      popUp = true;
      return;
    }

    const familyInfo = makeStr({
      fmlyId: id,
      fmlyGndr: gender,
      fmlyName: name,
      fmlyBdte: birthday,
      fmlyType: typeselected,
      fmlyZip: addNum,
      fmlyAddr: add,
      fmlyAddrDtl: addDetail,
      fmlyAgreYon: agree ? "Y" : "N",
      fmlyTel: tel,
    });

    if (id == -1) {
      //현재 선택한 사람이 없다는 뜻이므로 신규등록
      url = authUrlAddr + "/v1/member/insertMemberFamilyInfo";
    } else {
      //현재 선택한 사람이 있다는 뜻이므로 수정을 진행
      url = authUrlAddr + "/v1/member/updateMemberFamilyInfo";
    }
    try {
      let result = await postAPI(url, familyInfo, jwt);
      if (result > 0) {
        //성공했으면 가족목록창으로 돌아감
        goto(urlList.uaFamLst);
      } else {
        //등록 또는 수정에 실패했다는 창 띄움
        selectPopup = "insertFail";
        popUp = true;
      }
    } catch (err) {
      console.error(err);
      selectPopup = "insertFail";
      popUp = true;
    }
  }

  /**
   * 삭제 버튼을 눌렀을 시에 삭제 확인 팝업을 띄우는 함수
   */
  function checkDelete() {
    selectPopup = "checkdelete";
    popUp = true;
  }

  /**
   * 삭제 팝업 창을 닫는 함수
   */
  function closeButton() {
    popUp = false;
  }

  /**
   * 회원가족 정보 중 한명을 삭제하는 함수
   */
  async function deleteFamily() {
    const url = authUrlAddr + "/v1/member/deleteMemberFamilyInfo";
    let result = await deleteAPI(url, JSON.stringify({ fmlyId: id }), jwt);
    //성공 실패에 따라 창을 다르게 띄운다.
    if (result > 0) {
      goto(urlList.uaFamLst);
    } else {
      selectPopup = "deleteFail";
      popUp = true;
    }
  }

  /**
   * 휴대번호 형식으로 자동 변환해주는 함수
   */
  function telBlur() {
    tel = tel.replace(/\D/g, "");
    if (tel.length == 11) {
      tel = tel.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
    }
  }

  /**
   * 생년월일 형식으로 자동 변환해주는 함수
   */
  function birthdayBlur() {
    birthday = birthday.replace(/\D/g, "");

    if (birthday.length == 8) {
      birthday = birthday.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
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
    console.log(data);
    addNum = data.zonecode;
    add = data.address;
    addToggle = false;
    addDetailInput.focus();
  }
</script>

<Nav>
  {#if id == -1}
    가족등록
  {:else}
    가족수정
  {/if}
</Nav>
<section class="contents">
  <div class="form_wrap">
    <h3>가족관계</h3>
    <div class="select_wrap big" style="margin-bottom: 0">
      <select name id bind:value={typeselected}>
        {#each familyTypes as familyType}
          <option value={familyType.type}>{familyType.type}</option>
        {/each}
      </select>
    </div>

    <h3>성별</h3>
    <div class="select_wrap big" style="margin-bottom: 0">
      <select name id bind:value={gender}>
        <option value="M">남</option>
        <option value="F">여</option>
      </select>
    </div>

    <label>
      <input type="text" required id name bind:value={name} />
      <span>이름</span>
    </label>

    <label>
      <input type="text" required id name bind:value={birthday} on:blur={birthdayBlur} maxlength="8" />
      <span>생년월일(8자리,YYYYMMDD)</span>
    </label>

    <h2 style="padding-top: 12px">선택항목</h2>
    <label>
      <input type="text" required id name bind:value={tel} on:blur={telBlur} maxlength="13" />
      <span>휴대폰 번호(11자리)</span>
    </label>

    <h3>주소</h3>
    <label>
      <input type="text" required id name bind:value={addNum} maxlength="8" />
      <span>우편번호</span>
      <button class="mbtn_n" on:click={toggleButton}>주소 찾기</button>
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
      <input
        type="text"
        required
        id
        name
        placeholder="상세주소"
        bind:value={addDetail}
        bind:this={addDetailInput}
        maxlength="100"
      />
    </label>

    <label class="none">
      <input type="checkbox" name id bind:checked={agree} />
      <span />
      가족 대리접수 동의 [필수]
    </label>

    <div class="box_1 box_line">
      <ul class="ul_list">
        <li>가족(부모. 자녀) 정보 등록 시 가족에게 위임을 받았음을 확인합니다.</li>
        <li>무단 혹은 허위로 대리접수하면 개인정보처리에 관한 법률에 위배되어 법적 책임이 발생할 수 있습니다.</li>
      </ul>
    </div>

    <div class="btn_wrap">
      <button
        class="btn_01"
        on:click={() => {
          insertFamily();
        }}
      >
        {#if id == -1}
          등록
        {:else}
          수정
        {/if}
      </button>
      {#if id != -1}
        <button
          class="btn_01"
          on:click={() => {
            checkDelete();
          }}>삭제</button
        >
      {/if}
    </div>
  </div>
</section>

{#if selectPopup == "checkdelete"}
  <PopUp {popUp}>
    <slot>
      <h2>삭제 확인</h2>
      <br />삭제하시겠습니까?
      <button
        type="button"
        class="alert_close"
        on:click={() => {
          closeButton();
        }}
      >
        <i class="xi-close-min" />
      </button>
    </slot>
    <div slot="btns" class="btn_wrap">
      <div style="display: flex;">
        <button
          type="button"
          class="btn_01"
          name="chbtn"
          id="remote"
          on:click={() => {
            closeButton();
          }}
          >취소
        </button>
        <button
          type="button"
          style="margin-top: 0;"
          class="btn_04"
          name="chbtn"
          id="visit"
          on:click={() => {
            closeButton();
            deleteFamily();
          }}
        >
          확인
        </button>
      </div>
    </div>
  </PopUp>
{:else if selectPopup == "deleteFail"}
  <PopUp {popUp}>
    <slot>
      <h2>삭제 실패</h2>
      <br />삭제 중 오류가 발생했습니다.
      <button
        type="button"
        class="alert_close"
        on:click={() => {
          closeButton();
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
          closeButton();
        }}
      >
        확인
      </button>
    </div>
  </PopUp>
{:else if selectPopup == "insertFail"}
  <PopUp {popUp}>
    <slot>
      <h2>
        {#if id == -1}
          등록
        {:else}
          수정
        {/if}
        실패
      </h2>
      <br />오류가 발생했습니다.
      <button
        type="button"
        class="alert_close"
        on:click={() => {
          closeButton();
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
          closeButton();
        }}
      >
        확인
      </button>
    </div>
  </PopUp>
{:else if selectPopup == "error"}
  <PopUp {popUp}>
    <slot>
      <h2>
        {#if id == -1}
          등록
        {:else}
          수정
        {/if}
        실패
      </h2>
      <br />
      {#if regError == "생년월일"}
        생년월일을 정확히 입력해주세요.
      {:else if regError == "휴대번호"}
        휴대번호를 정확히 입력해주세요.
      {:else if regError == "미동의"}
        가족 대리접수 동의가 필요합니다.
      {:else if regError == "이름"}
        이름을 입력해주세요.
      {/if}
      <button
        type="button"
        class="alert_close"
        on:click={() => {
          closeButton();
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
          closeButton();
        }}
      >
        확인
      </button>
    </div>
  </PopUp>
{/if}
