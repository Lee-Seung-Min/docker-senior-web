<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { getAPI } from "$lib/js/getAPI";
  import { authUrlAddr } from "$lib/js/urlAddr";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";

  let familyData = [];
  let memberData = {};

  let jwt = "";
  let refresh = "";

  /**
   * 페이지가 로딩되면서, 현재 로그인 되어있는 회원과 등록되어 있는 가족 정보를 가져온다.
   */
  onMount(async () => {
    jwt = localStorage.getItem("userJwt");
    refresh = localStorage.getItem("refreshJwt");

    try {
      const url = authUrlAddr + "/v1/member/getFamilyList";
      const result = await getAPI(url, jwt);
      console.log(result);
      familyData = result.resultVO;

      familyData.forEach((element) => {
        if (element.fmlyGndr == "M") {
          element.fmlyGndr = "남";
        } else if (element.fmlyGndr == "F") {
          element.fmlyGndr = "여";
        } else {
          element.fmlyGndr = "기타";
        }
      });

      console.log(result);

      const url2 = authUrlAddr + "/v1/member/selectMemberInfo";
      const result2 = await getAPI(url2, jwt);
      memberData = result2;

      if (memberData.mbrGndr == "M") {
        memberData.mbrGndr = "남";
      } else if (memberData.mbrGndr == "F") {
        memberData.mbrGndr = "여";
      } else {
        memberData.mbrGndr = "기타";
      }
      console.log(result2);
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
</script>

<Nav>가족 목록 관리</Nav>

<section class="contents" style="padding-bottom: 24px">
  <div class="list_box">
    <div class="box_1">
      <div>
        <p class="name">
          {memberData.mbrName}
          <span class="bat_me" />
        </p>
        <p>{memberData.mbrRegDttm} | 성별 : {memberData.mbrGndr}</p>
        <p>{memberData.mbrTel}</p>
        <div class="ar">
          <button class="mbtn_n_3" on:click={() => goto(urlList.uaMbrInfo)}>수정</button>
        </div>
      </div>
    </div>

    {#each familyData as data}
      <div class="box_1">
        <div>
          <p class="name">
            {data.fmlyName}
            <span class="bat_other">{data.fmlyType}</span>
          </p>
          <p>{data.fmlyBdte} | 성별 : {data.fmlyGndr}</p>
          <p>{data.fmlyTel}</p>
          <div class="ar">
            <button class="mbtn_n_3" on:click={() => goto(urlList.uaFamMng + "?id=" + data.fmlyId)}>수정</button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>
<div class="bottom_btn_fixed" style="padding: 0 24px">
  <button class="btn_01" on:click={() => goto(urlList.uaFamMng + "?id=-1")}>신규 가족 등록</button>
</div>
