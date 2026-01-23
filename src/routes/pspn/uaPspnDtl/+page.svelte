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
  import { getUserId } from "$lib/js/getUserId";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
  import { drcpPspnId } from "$lib/store/pspnStore.js";
  import PageLoader from "$lib/sub/PageLoader.svelte";
  import { getCall, goMap } from "$lib/js/phoneAction";
  let pspnId;
  let pspnDtl = [];
  let popUp = false;
  let popUpWhat;
  let message;
  let drcpId;
  let drstExist = false;
  onMount(async () => {
    pspnId = $page.url.searchParams.get("pspnId");
    drcpId = $page.url.searchParams.get("drcpId");
    $footCheck = "menu2";
    const jwt = localStorage.getItem("userJwt");
    const refresh = localStorage.getItem("refreshJwt");
    try {
      //사용자 id를 가져온다.
      await getUserId(jwt).then(async (result) => {
        //id를 가져온 후의 로직을 작성.
        if (result != "" && result != undefined && result != "") {
          await firstLoad();
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

  async function firstLoad() {
    popUpWhat = "loading";
    let url;
    if (drcpId != "null") {
      url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/pspn/selectPspnDtl?pspnId=" + pspnId + "&drcpId=" + drcpId;
      drstExist = true;
    } else {
      url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/pspn/selectPspnDtl?pspnId=" + pspnId;
    }

    let resData = await getAPI(url);
    if (resData.resultVO == null) {
      popUp = true;
      popUpWhat = "failLoad";
    } else {
      pspnDtl = resData.resultVO;
      console.log(pspnDtl);
      popUpWhat = "";
    }
  }
  async function cancelPpds() {
    popUpWhat = "loading";
    const url = /*urlAddr + "8082*/ shopUrlAddr + "/v1/ppds/cancelPrescriptionFromPatient";
    let jsonStr = makeStr({ pspnId, drcpId });
    let res = await postAPI(url, jsonStr);
    console.log(res);
    if (res.code == 200) {
      popUpWhat = "response";
      message = "조제 취소하였습니다.";
    } else {
      popUpWhat = "response";
      message = res.message;
    }
  }
  async function reqPpds() {
    popUpWhat = "loading";
    const url = /*urlAddr + "8082*/ shopUrlAddr + "/v1/ppds/setPaymentByPrescription";
    let jsonStr = makeStr({ pspnId, drcpId });
    let res = await postAPI(url, jsonStr);
    console.log(res);
    if (res.code == 200) {
      popUpWhat = "response";
      message = "조제 요청하였습니다.";
    } else {
      popUpWhat = "response";
      message = res.message;
    }
  }
  //팝업 닫기
  function xButton() {
    popUp = false;
  }
  function gotoBack() {
    popUp = false;
    goto(urlList.uaPspnLst);
  }
</script>

<Nav>전자처방전</Nav>

<section class="contents">
  {#if pspnDtl.length != 0}
    <h3>
      전자처방전 상세보기
      <!-- <span class="mbtn_t">
      {#if pspnDtl.drcpStat > 1 && pspnDtl.drcpStat < 9}약국 제출{:else}약국 제출전{/if}
    </span> -->
    </h3>

    <div class="box_1">
      <dl class="info_dl" id="pre_view">
        <dt>발급일</dt>
        <dd>{pspnDtl.pspnRegDttm.replace('am', '오전').replace('pm', '오후')}</dd>
        <dt>병원명</dt>
        <dd>{pspnDtl.hsptName}</dd>
        <dt>환자명</dt>
        <dd>{pspnDtl.ptntName}</dd>
        {#if drstExist}
          {#if pspnDtl.drstName != null}
            <dt>약국명</dt>
            <dd>{pspnDtl.drstName}</dd>
          {/if}
          {#if pspnDtl.shpAddr != null}
            <dt>약국주소</dt>
            <dd>
              {pspnDtl.shpAddr}
              {#if pspnDtl.shpAddrDtl != null}{pspnDtl.shpAddrDtl}{/if}
              <button
                type="button"
                class="mbtn_t_2b"
                on:click={() => {
                  goMap(
                    "https://map.kakao.com/link/map/" +
                      pspnDtl.drstName +
                      "," +
                      pspnDtl.drcpShpCoorX +
                      "," +
                      pspnDtl.drcpShpCoorY
                  );
                }}
              >
                지도보기
              </button>
            </dd>
          {/if}
          {#if pspnDtl.drcpShpTel != null}
            <dt>약국번호</dt>
            <dd>
              {pspnDtl.drcpShpTel}
              <button type="button" class="mbtn_t_1b" on:click={getCall(pspnDtl.drcpShpTel)}>전화하기</button>
            </dd>
          {/if}
        {/if}
        {#if pspnDtl.drcpPay != "0" && pspnDtl.drcpPay != null && pspnDtl.drcpPay != undefined}
          <dt>비용</dt>
          <dd>{pspnDtl.drcpPay}원</dd>
        {/if}
        <dt>접수상태</dt>
        {#if pspnDtl.drcpStatText != null}
          <dd>{pspnDtl.drcpStatText}</dd>
        {:else}
          <dd>미전송</dd>
        {/if}
        <dt class="wide">
          {#if pspnDtl.pspnUrl == "N"}
            <h3>현재 발급된 처방전이 없습니다.</h3>
          {/if}
          처방전은 14일이내 확인가능합니다. <br />이후 삭제됩니다.
        </dt>
        <!-- <dt>복약방법</dt>
      <dd>1일 3회 / 3일 / 식후 30분</dd>
      <dt>주의사항</dt>
      <dd>공복에 복약 금지</dd>
      <dt>복약방법</dt>
      <dd>처방받은 약 (3종)</dd>
      <dd class="wide">
        <table>
          <tr>
            <td>유시락스</td>
            <td>1정</td>
            <td>3회</td>
            <td />
          </tr>
          <tr>
            <td>메디락스에스산</td>
            <td>1정</td>
            <td>3회</td>
            <td />
          </tr>
          <tr>
            <td>유시락</td>
            <td>1정</td>
            <td>3회</td>
            <td />
          </tr>
        </table>
      </dd> -->
        <!-- <dt class="wide">
        <label class="check">복용알림 <input type="checkbox" name="" class="type2" /><span /></label>
        <label class="select_data"><input type="text" class="datepicker" /></label>
        <div class="select_wrap">
          <select name="" id="">
            <option value="">아침시간</option>
            <option value="">09:00</option> -->
        <!--  시간 간격 확인 요망 -->
        <!-- </select>
          <select name="" id="" aria-placeholder="">
            <option value="">점심시간</option>
            <option value="">09:00</option> -->
        <!--  시간 간격 확인 요망 -->
        <!-- </select>
          <select name="" id="">
            <option value="">저녁시간</option>
            <option value="">09:00</option> -->
        <!--  시간 간격 확인 요망 -->
        <!-- </select>
        </div>
      </dt> -->
      </dl>
    </div>

    {#if pspnDtl.pspnUrl == "Y"}
      <div class="btn_wrap">
        <button
          type="button"
          class="btn_04"
          on:click={() => {
            goto(urlList.uaPspnImg + "?pspnId=" + pspnId);
          }}>처방전 보기</button
        >
      </div>

      <div class="btn_wrap inline">
        {#if pspnDtl.drcpStat == null || pspnDtl.drcpStat == "9"}
          <button
            type="button"
            class="btn_01"
            on:click={() => {
              $drcpPspnId = pspnId;
              goto(urlList.uaPspnRgst);
            }}>약국지정</button
          >
        {:else if pspnDtl.drcpStat == "1"}
          <button
            type="button"
            class="btn_01"
            on:click={() => {
              popUp = true;
              popUpWhat = "cancel";
            }}>조제 취소</button
          >
        {:else if pspnDtl.drcpStat == "2"}
          <button
            type="button"
            class="btn_01"
            on:click={() => {
              popUp = true;
              popUpWhat = "cancel";
            }}>조제 취소</button
          >
          <button
            type="button"
            class="btn_01"
            on:click={() => {
              popUp = true;
              popUpWhat = "req";
            }}>조제 요청</button
          >
        {:else if pspnDtl.drcpStat == "3"}
          <button
            type="button"
            class="btn_01"
            on:click={() => {
              popUp = true;
              popUpWhat = "cancel";
            }}>조제 취소</button
          >
        {/if}
      </div>
    {/if}
  {/if}
</section>
{#if popUpWhat == "cancel"}
  <PopUp {popUp}>
    <slot>
      조제를 취소하시겠습니까? <button type="button" class="alert_close" on:click={xButton}
        ><i class="xi-close-min" /></button
      >
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
      <button
        type="button"
        class="mbtn_n_4"
        name="chbtn"
        id="close"
        on:click={() => {
          cancelPpds();
        }}>예</button
      >
      <button type="button" class="mbtn_n_9" id="close" on:click={xButton}>아니오</button>
    </p>
    <p />
  </PopUp>
{:else if popUpWhat == "req"}
  <PopUp {popUp}>
    <slot>
      조제를 요청하시겠습니까? <button type="button" class="alert_close" on:click={xButton}
        ><i class="xi-close-min" /></button
      >
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
      <button
        type="button"
        class="mbtn_n_4"
        name="chbtn"
        id="close"
        on:click={() => {
          reqPpds();
        }}>예</button
      >
      <button type="button" class="mbtn_n_9" id="close" on:click={xButton}>아니오</button>
    </p>
    <p />
  </PopUp>
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
          goto(urlList.uaPspnLst);
        }}>확인</button
      >
    </p>
    <p />
  </PopUp>
{:else if popUpWhat == "loading"}
  <PageLoader></PageLoader>
{:else if popUpWhat == "failLoad"}
  <PopUp {popUp}>
    <slot>
      비정상적인 접근입니다. <br />이전페이지로 돌아가주세요
      <button type="button" class="alert_close" on:click={gotoBack}><i class="xi-close-min" /></button>
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
      <button type="button" class="mbtn_n_4" id="close" on:click={gotoBack}>확인</button>
    </p>
    <p />
  </PopUp>
{/if}
