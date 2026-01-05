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
    } from "$lib/store/rgstStore.js";
    import { getUserId } from "$lib/js/getUserId";
    import PageLoader from "$lib/sub/PageLoader.svelte";
    let dgnsId;
    let dateString;
    let dgns = [];
    let popUp = false;
    let popUpWhat = "abnomal";

    let isLoading = false;
    let startY = 0;
    let scrollTop = 0;
    let distance = 0;
    let dgnsIndex = 0;
    let dgnsLevel = 0;
    let dgnsProcess = [
        {
            level: 0,
            mainText: "병원에서 접수를 확인 중입니다.",
        },
        {
            level: 3,
            mainText: "병원에서 접수를 확인 후 확정했습니다. ",
            subText: "의사 선생님이 비대면 진료실을 개설하면 앱 알림이 발송됩니다.",
        },
        {
            level: 5,
            mainText: "병원에서 진료 준비를 마쳤습니다.",
        },
        {
            level: 7,
            mainText: "병원에서 수납을 요청합니다.",
        },
        {
            level: 8,
            mainText: "병원에서 수납이 완료되었습니다.",
        },
        {
            level: 9,
            mainText: "접수가 취소되었습니다.",
        },
    ];
    //진료 예약 상세
    onMount(async () => {
        dgnsId = $page.url.searchParams.get("dgnsId");
        childMount.set(false);
        $footCheck = "menu1";

        const jwt = localStorage.getItem("userJwt");
        const refresh = localStorage.getItem("refreshJwt");
        try {
            //사용자 id를 가져온다.
            await getUserId(jwt).then(async (result) => {
                //id를 가져온 후의 로직을 작성.
                if (result != "" && result != undefined && result != "") {
                    await loadFirst();
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
                goto("/mbr/uaLogin");
            }
        }
    });

    async function loadFirst() {
        isLoading = true;
        const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/dgns/selectDgnsDtl?dgnsId=" + dgnsId;
        let resData = await getAPI(url);
        if (resData.resultVO == null) {
            popUp = true;
            popUpWhat = "abnomal";
        } else {
            dgns = resData.resultVO;
            setDgnsProcess();
        }
        isLoading = false;
    }

    function chngDgns() {
        $dgnsShpId = dgns.dgnsShpId;
        $dgnsDtrId = dgns.dgnsDtrId;
        $dgnsMemo = dgns.dgnsMemo;
        $dgnsRsvDttm = dgns.dgnsRsvDttm;
        $dgnsDeptId = dgns.dgnsDeptId;
        $dgnsItemId = dgns.dgnsItemId;
        $dgnsType = dgns.dgnsType;
        $treat_target = dgns.dgnsPatName;
        $treat_hspt = dgns.dgnsShpName;
        $treat_dept = dgns.dgnsDeptName;
        $treat_item = dgns.dgnsItemName;
        $treat_dtr = dgns.dgnsDtrName;
        goto(urlList.uaDgnsChng + "?dgnsId=" + dgnsId);
    }

    function xButton() {
        goto(urlList.uaDgnsLst);
    }

    //진료 취소 팝업
    function cancelReg() {
        popUpWhat = "cancel";
        popUp = true;
    }
    //진료 취소
    async function cancel() {
        let jsonStr = makeStr({ dgnsId, dgnsStat: 9, dgnsUpdtName: "본인", dgnsCnclRsn: "환자취소" });
        const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/dgns/updateDgnsInfo";
        let res = await postAPI(url, jsonStr);
        if (res.resultVO == true) {
            popUp = false;
            loadFirst();
        }
    }

    // 새로고침
    function handleTouchStart(event) {
        startY = event.touches[0].pageY;
        scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    }

    function handleTouchMove(event) {
        if (scrollTop > 0 || isLoading) return; // 화면 맨 위가 아니거나 이미 새로고침 중이면 무시

        distance = event.touches[0].pageY - startY;
    }

    async function handleTouchEnd() {
        if (scrollTop > 0 || isLoading) return; // 화면 맨 위가 아니거나 이미 새로고침 중이면 무시

        if (distance > 30) {
            // 스와이프 거리가 30px 이상일 때만 새로고침
            await loadFirst();
        }
        distance = 0; // 초기화
        startY = 0; // 초기화
    }

    function setDgnsProcess() {
        dgnsLevel = dgns.dgnsStat;
        if (dgnsLevel == 7 && dgns.mpayStat == 5) {
            dgnsLevel = 8;
        }
        dgnsIndex = dgnsProcess.findIndex((item) => item.level == dgnsLevel);
        console.log(dgnsIndex);
    }
</script>

<Nav>
    진료
    {#if dgns.dgnsWlkYon == "N"}
        예약
    {:else}
        접수
    {/if}
    내역
</Nav>
<!-- content S -->

<section class="contents" on:touchstart={handleTouchStart} on:touchmove={handleTouchMove} on:touchend={handleTouchEnd}>
    <div>
        <p>화면을 밑으로 당겨 새로고침 하세요.</p>
        <br />
    </div>
    {#if isLoading}
        <PageLoader />
    {:else if dgns.length != 0}
        <div class="box_1">
            <dl class="info_dl">
                {#if dgns.dgnsWlkYon == "N"}
                    <dt>예약 일시</dt>
                {:else}
                    <dt>접수 일시</dt>
                {/if}
                <dd>{dgns.dgnsRsvDttm}</dd>
                <dt>진료 대상</dt>
                <dd>{dgns.dgnsPatName}</dd>
                <dt>진료 병원</dt>
                <dd>{dgns.dgnsShpName}</dd>
                <dt>진료사유</dt>
                <dd>{dgns.dgnsMemo}</dd>
                <dt>진료비</dt>
                <dd>{dgns.dgnsPay}</dd>
            </dl>
        </div>
        <div class="box_1" style="white-space: pre-wrap">
            <div style="font-weight: bold; font-size:large ">
                {dgnsProcess[dgnsIndex].mainText}
                {#if dgnsIndex == 1 && dgns.dgnsType == "U"}
                    <div style="color: #3079cd; font-size:small; font-weight:normal">
                        {dgnsProcess[dgnsIndex].subText}
                    </div>
                {/if}
            </div>
        </div>

        {#if dgnsLevel != 9}
            <div class="btn_wrap inline4">
                <div class="button-container">
                    <div class="step {dgnsLevel >= 3 ? 'completed' : ''}">1</div>
                    <div class="line {dgnsLevel >= 5 ? 'completed' : ''}"></div>
                    <button type="button" class={dgnsLevel >= 3 ? "btn_01" : "btn_04"}>접수확정</button>
                </div>
                <div class="button-container">
                    <div class="step {dgnsLevel >= 5 ? 'completed' : ''}">2</div>
                    <div class="line {dgnsLevel >= 7 ? 'completed' : ''}"></div>
                    <button type="button" class={dgnsLevel >= 5 ? "btn_01" : "btn_04"}>진료</button>
                </div>
                <div class="button-container">
                    <div class="step {dgnsLevel >= 7 ? 'completed' : ''}">3</div>
                    <div class="line {dgnsLevel >= 8 ? 'completed' : ''}"></div>
                    <button type="button" class={dgnsLevel >= 7 ? "btn_01" : "btn_04"}>결제</button>
                </div>
                <div class="button-container">
                    <div class="step {dgnsLevel >= 8 ? 'completed' : ''}">4</div>
                    <button type="button" class={dgnsLevel >= 8 ? "btn_01" : "btn_04"}>결제완료</button>
                </div>
            </div>
        {/if}
        <div class="btn_wrap inline">
            {#if dgns.dgnsStat == 0}
                {#if dgns.dgnsType == "U"}
                    <button
                        type="button"
                        class="btn_01"
                        on:click={() => {
                            goto(urlList.uaVdodgnsWt1 + "?dgnsId=" + dgnsId);
                        }}
                        >본인확인
                    </button>
                {/if}

                {#if dgns.dgnsWlkYon == "N"}
                    <button type="button" class="btn_03" on:click={chngDgns}>예약변경</button>
                    <button
                        type="button"
                        class="btn_06"
                        id="show"
                        on:click={cancelReg}
                        value="예약을 취소 하시겠습니까?">접수 취소</button
                    >
                {:else}
                    <button
                        type="button"
                        class="btn_06"
                        id="show"
                        on:click={cancelReg}
                        value="예약을 취소 하시겠습니까?">접수 취소</button
                    >
                {/if}
            {/if}
            {#if dgns.dgnsStat == 5}
                {#if dgns.dgnsType == "U"}
                    <button
                        type="button"
                        class="btn_01"
                        on:click={() => {
                            goto(urlList.uaVdodgnsWt + "?dgnsId=" + dgnsId);
                        }}>진료시작</button
                    >
                {/if}
            {/if}
            {#if dgns.dgnsStat == 7 && dgns.mpayStat != 5}
                <button
                    type="button"
                    class="btn_05"
                    on:click={() => {
                        goto(urlList.uaPayMbrDgns + "?dgnsId=" + dgnsId);
                    }}
                    >결제
                </button>
            {/if}
        </div>
    {/if}
</section>
{#if popUpWhat == "cancel"}
    <PopUp {popUp}>
        <slot
            >예약을 취소 하시겠습니까?
            <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
        </slot>
        <div slot="btns" class="btn_wrap">
            <button type="button" class="mbtn_n_4" name="chbtn" on:click={cancel} id="close">예</button>
            <button type="button" class="mbtn_n_9" name="chbtn" on:click={xButton} id="close">아니오</button>
        </div>
    </PopUp>
{:else if popUpWhat == "abnomal"}
    <PopUp {popUp}>
        <slot>
            비정상적인 접근입니다. <br />이전페이지로 돌아가주세요
            <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
        </slot>
        <p class="btn_wrap" id="btn" slot="btns">
            <button type="button" class="mbtn_n_4" id="close" on:click={xButton}>확인</button>
        </p>
        <p />
    </PopUp>
{/if}
