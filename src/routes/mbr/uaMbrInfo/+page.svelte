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
  import { apiServerAddr, authUrlAddr } from "$lib//js/urlAddr";
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
  let birthdate = "";
  let phone = "";
  let addNum = "";
  let add = "";
  let addDetail = "";
  let id = "";
  let gender = "";
  let centerList = [];
  let centerId = "";

  let addToggle = false;
  let popUp = false;
  let selectPopUp = "";

  $: centerOptions = [
    { value: "", label: "경로당 선택" },
    ...centerList.map((c) => ({
      value: String(c.id), // 서버 전송용
      label: `${c.region} ${c.name}경로당`,
    })),
  ];

  /**
   * 페이지 로딩시에 현재 로그인 되어있는 고객의 정보를 가져온다.
   */
  onMount(async () => {
    userJwt = localStorage.getItem("userJwt");
    refresh = localStorage.getItem("refreshJwt");
    logintool = localStorage.getItem("logintool");

    try {
      const url = authUrlAddr + "/v1/member/selectMemberInfo";
      let result = await getAPI(url, userJwt);

      const centerListURL = apiServerAddr + "/v1/ext/centers";
      let centerListResult = await getAPI(centerListURL);
      centerList = centerListResult.resultVO;

      id = result.mbrId;
      name = result.mbrName;
      phone = result.mbrTel;
      birthdate = result.mdtlBrth;
      gender = result.mbrGndr;
      addNum = result.mbrZip;
      add = result.mbrAddr;
      addDetail = result.mbrAddrDtl;
      centerId = result.mbrCenterId ? String(result.mbrCenterId) : "";
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
      mdtlBrth: birthdate,
      mbrGndr: gender,
      mbrCenterId: centerId,
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

<svelte:head></svelte:head>

<Nav>회원정보 수정</Nav>
<section class="profilePage">
  <div class="profileCard">
    <!-- 이름 -->
    <label class="field">
      <span class="field__label">이름</span>
      <input
        class="field__input"
        type="text"
        bind:value={name}
        maxlength="10"
      />
    </label>

    <!-- 휴대전화 -->
    <label class="field">
      <span class="field__label">휴대전화</span>
      <input
        class="field__input"
        type="text"
        bind:value={phone}
        maxlength="13"
      />
    </label>

    <!-- 생년월일 -->
    <label class="field">
      <span class="field__label">생년월일</span>
      <input class="field__input" type="date" bind:value={birthdate} />
    </label>

    <!-- 성별 -->
    <div class="field">
      <span class="field__label">성별</span>

      <div class="genderToggle" role="radiogroup" aria-label="성별">
        <label class="genderToggle__option">
          <input
            class="genderToggle__input"
            type="radio"
            name="gender"
            value="M"
            bind:group={gender}
          />
          <span class="genderToggle__text">남성</span>
        </label>

        <label class="genderToggle__option">
          <input
            class="genderToggle__input"
            type="radio"
            name="gender"
            value="F"
            bind:group={gender}
          />
          <span class="genderToggle__text">여성</span>
        </label>
      </div>
    </div>

    <!-- 소속 경로당 -->
    <label class="field">
      <span class="field__label">소속 경로당</span>

      <div class="selectBox">
        <select class="selectBox__select" bind:value={centerId}>
          {#each centerOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>
    </label>

    <!-- 우편번호 + 주소찾기 -->
    <label class="field field--zip">
      <span class="field__label">주소</span>
      <input
        class="field__input"
        type="text"
        maxlength="11"
        bind:value={addNum}
        title="우편번호"
      />
      <button class="zipBtn" type="button" on:click={toggleButton}
        >주소 찾기</button
      >
    </label>

    {#if addToggle}
      <div class="postcodeWrap">
        <Daum height="450px" autoClose="true" on:complete={addComplete} />
      </div>
    {/if}

    <!-- 기본주소 -->
    <label class="field">
      <span class="field__label">기본주소</span>
      <input
        class="field__input"
        type="text"
        bind:value={add}
        maxlength="30"
        title="기본주소"
      />
    </label>

    <!-- 상세주소 -->
    <label class="field">
      <span class="field__label">상세주소</span>
      <input
        class="field__input"
        type="text"
        bind:value={addDetail}
        maxlength="100"
        title="상세주소"
      />
    </label>

    <!-- 저장 버튼 -->
    <div class="actions">
      <button class="primaryBtn" type="button" on:click={updateData}
        >정보 수정</button
      >
    </div>

    <!-- 탈퇴 -->
    {#if logintool == "apple"}
      <div class="withdrawRow">
        <div class="withdrawRow__label">회원탈퇴</div>
        <div
          id="appleid-signin"
          data-color="black"
          data-border="true"
          data-type="sign in"
          data-mode="logo-only"
        />
      </div>
    {:else if logintool == "kakao" || logintool == "google"}
      <div class="actions actions--center">
        <button class="dangerBtn" type="button" on:click={quitCheck}
          >회원탈퇴</button
        >
      </div>
    {/if}

    <div class="bottomSpacer" aria-hidden="true"></div>
  </div>
</section>

<style>
  :root {
    --bottom-nav-h: 80px; /* 네 탭바 높이에 맞춰 조절 (90~110 사이) */
  }

  /* profilePage는 padding-bottom 너무 크게 줄 필요 없음 */
  .profilePage {
    padding: 18px 14px 20px;
    background: #f6f7fb;
    min-height: 100dvh;
  }

  /* ✅ 스크롤 끝을 밀어주는 진짜 해결책 */
  .bottomSpacer {
    height: calc(var(--bottom-nav-h) + 24px + env(safe-area-inset-bottom));
  }

  .profileCard {
    max-width: 560px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    padding: 18px 16px 16px;
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  }

  /* Field */
  .field {
    display: block;
    margin: 16px 0;
  }

  .field__label {
    display: block;
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.62);
    letter-spacing: -0.2px;
  }

  .field__input {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.14);
    background: #fff;
    padding: 14px 14px 12px;
    font-size: 16px;
    outline: none;
    box-sizing: border-box;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .field__input:focus {
    border-color: rgba(16, 166, 213, 0.95);
    box-shadow: 0 0 0 4px rgba(16, 166, 213, 0.18);
  }

  /* Select */
  .selectBox {
    position: relative;
  }

  .selectBox__select {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.14);
    background: #fff;
    padding: 14px 44px 12px 14px;
    font-size: 16px;
    outline: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    box-sizing: border-box;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .selectBox__select:focus {
    border-color: rgba(16, 166, 213, 0.95);
    box-shadow: 0 0 0 4px rgba(16, 166, 213, 0.18);
  }

  .selectBox::after {
    content: "";
    position: absolute;
    right: 14px;
    top: 50%;
    width: 10px;
    height: 10px;
    border-right: 2px solid rgba(0, 0, 0, 0.45);
    border-bottom: 2px solid rgba(0, 0, 0, 0.45);
    transform: translateY(-45%) rotate(45deg);
    pointer-events: none;
  }

  /* Zip + button */
  .field--zip {
    position: relative;
  }

  .field--zip .field__input {
    padding-right: 120px;
  }

  .zipBtn {
    position: absolute;
    right: 8px;
    bottom: 7px;
    height: 36px;
    padding: 0 12px;
    border: 0;
    border-radius: 10px;
    background: #003c82;
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition:
      transform 0.12s ease,
      opacity 0.12s ease;
  }

  .zipBtn:hover {
    opacity: 0.92;
  }

  .zipBtn:active {
    transform: scale(0.98);
  }

  /* Postcode */
  .postcodeWrap {
    margin-top: 10px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: #fff;
  }

  /* Actions */
  .actions {
    margin-top: 18px;
    display: flex;
    gap: 10px;
  }

  .actions--center {
    justify-content: center;
    margin-top: 10px;
  }

  .primaryBtn {
    width: 100%;
    height: 52px;
    border: 0;
    border-radius: 12px;
    background: #10a6d5;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 4px rgba(16, 166, 213, 0.24);
    transition:
      transform 0.12s ease,
      filter 0.12s ease;
  }

  .primaryBtn:hover {
    filter: brightness(0.98);
  }

  .primaryBtn:active {
    transform: scale(0.99);
  }

  .dangerBtn {
    width: 100%;
    height: 46px;
    border-radius: 12px;
    border: 1px solid rgba(232, 53, 53, 0.55);
    background: rgba(232, 53, 53, 0.08);
    color: #e83535;
    font-weight: 900;
    cursor: pointer;
    transition:
      transform 0.12s ease,
      opacity 0.12s ease;
  }

  .dangerBtn:hover {
    opacity: 0.92;
  }

  .dangerBtn:active {
    transform: scale(0.99);
  }

  /* Withdraw row (apple) */
  .withdrawRow {
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding-top: 6px;
  }

  .withdrawRow__label {
    font-weight: 800;
    color: rgba(0, 0, 0, 0.65);
  }

  /* Responsive */
  @media (max-width: 420px) {
    .profilePage {
      padding: 16px 12px 24px;
    }

    .profileCard {
      padding: 16px 12px 14px;
    }

    .field__input,
    .selectBox__select {
      height: 48px;
      font-size: 15px;
    }

    .field--zip .field__input {
      padding-right: 112px;
    }

    .zipBtn {
      height: 34px;
      padding: 0 10px;
      font-size: 12px;
    }
  }

  /* ===== Gender Toggle ===== */
  .genderToggle {
    display: flex;
    gap: 12px;
  }

  .genderToggle__option {
    flex: 1;
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }

  /* 라디오 자체는 완전히 숨김(레이아웃 영향 X) */
  .genderToggle__input {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
  }

  /* 버튼 UI */
  .genderToggle__text {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.14);
    background: #fff;

    font-size: 15px;
    font-weight: 800;
    color: rgba(0, 0, 0, 0.65);

    cursor: pointer;
    user-select: none;

    /* 혹시 다른 span 스타일이 전역으로 잡혀있을 때를 대비 */
    position: static;
    padding: 0;
    box-shadow: none;
  }

  /* 선택됨 */
  .genderToggle__input:checked + .genderToggle__text {
    border-color: rgba(16, 166, 213, 0.95);
    background: rgba(16, 166, 213, 0.12);
    color: #003c82;
    box-shadow: 0 0 0 4px rgba(16, 166, 213, 0.16);
  }

  /* 키보드 접근성 */
  .genderToggle__input:focus-visible + .genderToggle__text {
    outline: 2px solid rgba(16, 166, 213, 0.9);
    outline-offset: 2px;
  }
</style>
