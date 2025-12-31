<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { postAPI } from "$lib/js/postAPI";
  import { authUrlAddr } from "$lib/js/urlAddr";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { makeStr } from "$lib/js/makeStr";

  let jwt = "";
  let refresh = "";
  let id = "";

  let mediNotiHour = false;
  let mediNotiChange = false;
  let mediNotiFive = false;
  let mediTake = false;

  let marketing = false;
  let person = false;

  function gotoPage(url) {
    goto(url);
  }

  /**
   * 약관 동의 관련 리스트
   */
  let agreeList = [];

  onMount(async () => {
    try {
      jwt = localStorage.getItem("userJwt");
      refresh = localStorage.getItem("refreshJwt");

      const url = authUrlAddr + "/v1/member/selectMemberInfo";
      const result = await getAPI(url, jwt);
      console.log(result);
      id = result.mbrId;
      mediNotiHour = result.mbrBfrYon == "Y" ? true : false;
      mediNotiChange = result.mbrChngYon == "Y" ? true : false;
      mediNotiFive = result.mbrStbyYon == "Y" ? true : false;
      mediTake = result.mbrDinstYon == "Y" ? true : false;

      const url2 = authUrlAddr + "/v1/member/selectMemberTermsAgreeList";
      const result2 = await getAPI(url2, jwt);
      agreeList = result2;
      agreeList.forEach((e) => {
        if (e.agrTrmsId == "4") {
          //마케팅 동의 관련 약관 id가 들어가야함
          marketing = e.agrYon == "Y" ? true : false;
        } else if (e.agrTrmsId == "1") {
          //개인정보 제3자 제공 동의 관련 약관 id가 들어가야함
          person = e.agrYon == "Y" ? true : false;
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
        goto(urlList.uaLogin);
      }
    }
  });

  /**
   * 알림 관련 설정이 변할 때 마다 그 값을 DB에 저장하는 함수
   */
  async function updateAlarm() {
    const alarm = makeStr({
      mdtl_mbr_id: id,
      mdtl_bfr_yon: mediNotiHour ? "Y" : "N",
      mdtl_chng_yon: mediNotiChange ? "Y" : "N",
      mdtl_stby_yon: mediNotiFive ? "Y" : "N",
      mdtl_dinst_yon: mediTake ? "Y" : "N",
    });
    const url = authUrlAddr + "/v1/member/updateAlarmAgree";
    try {
      const result = await postAPI(url, alarm, jwt);
      if (result <= 0) {
        console.log("fail");
      }
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * 약관 동의 관련 동의가 변할 때마다 DB값을 변하게 하는 함수
   * @param id 약관 종류 id
   */
  async function updateAgree(id) {
    //약관 관련 id 임의지정
    //마케팅 관련 약관 id:1, 개인정보 동의 관련 약관 id:2로 하드코딩
    let yn = "";
    if (id == "1") {
      yn = marketing ? "Y" : "N";
    } else if (id == "2") {
      yn = person ? "Y" : "N";
    }

    let agrId = "";
    agreeList.forEach((e) => {
      if (e.agrTrmsId == id) {
        agrId = e.agrId;
      }
    });

    const url =
      authUrlAddr +
      "/v1/member/updateMemberTrmsAgreeInfo?agrId=" +
      agrId +
      "&yn=" +
      yn;
    try {
      const result = await getAPI(url);
    } catch (err) {
      console.err(err);
    }
  }
</script>

<Nav>동의서 관리</Nav>
<section class="contents">
  <div class="list_box" id="alatm_wrap">
    <div
      class="box_1 cursor-pointer"
      on:click={() => gotoPage(urlList.consents)}
    >
      <div class="flex justify-between">
        <p class="tit">약 대리수령 위임장 관리</p>
        <i class="xi-angle-right"></i>
      </div>
    </div>
    <div class="box_1">
      <p class="tit">개인정보 제3자 제공 동의</p>
      <label>
        이용자는 개인정보 제3자 제공 동의에 관해 거부할 권리가 있으며, 미동의
        시에는 모바일 접수/예약 서비스 이용이 불가 합니다.<br />
        <input
          type="checkbox"
          class="type2"
          disabled
          bind:checked={person}
          on:change={() => {
            updateAgree("2");
          }}
        />
        <span />
      </label>
    </div>
  </div>
</section>
