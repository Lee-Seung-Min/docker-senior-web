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
    import { dgnsType, wlkYon } from "$lib/store/rgstStore.js";
    import { getDtl } from "$lib/js/kakaoMap";
    import ResvPopUp from "$lib/sub/nav/ResvPopUp.svelte";
    import { getUserId } from "$lib/js/getUserId";
    import { getDow, getNew } from "$lib/js/dateFunction";
    import { getHsptType } from "$lib/js/getHsptType";
    import { getHsptTime } from "$lib/js/getHsptTime";
    import { getCall, goMap } from "$lib/js/phoneAction";
    import { addMapScript, makeDtlMap } from "$lib/js/mapFunction";
    let shpId;
    let agntId;
    let shpType;
    let shpDtl = [];
    let shpCtlsYon;
    let shpVstYon;
    let popUp = false;
    let resvPopUp = false;
    let setDgnsType;
    let hsptType = { ctlsDgns: false, ctlsRsv: false, vstDgns: false, vstRsv: false, ctls: false, visit: false };
    let timeData = { vacation: false, U: false, V: false, W: false, R: false };
    let ctls = false;
    let favChck;
    let mbrId;
    let favName;
    let favId;
    let jwt;
    let deptList = [];
    let dtrList = [];
    let itemList = [];
    let depts;
    let call;
    let notiList = [];
    let tdTime = [];
    let tdDtlTime = [];
    let hsptTime = [];
    let drstList = [];
    let qrType;
    onMount(async () => {
        $footCheck = "";
        shpType = $page.url.searchParams.get("shpType");
        qrType = $page.url.searchParams.get("qrType");
        //가맹점일 경우
        if (shpType == "shp") {
            jwt = localStorage.getItem("userJwt");
            //사용자 id를 가져온다.
            await getUserId(jwt).then(async (result) => {
                //id를 가져온 후의 로직을 작성.
                if (result != "" && result != undefined && result != "") {
                    mbrId = result;
                    shpId = $page.url.searchParams.get("shpId");

                    const url = shopUrlAddr + "/v1/Shop/selectShopInfoMobile?shpId=" + shpId;
                    let resData = await getAPI(url);

                    shpDtl = resData.resultVO;
                    if (shpDtl == null) {
                        goto(urlList.uaHome);
                    } else {
                        shpVstYon = shpDtl.shpVstYon;
                        shpCtlsYon = shpDtl.shpCtlsYon;
                        favChck = shpDtl.shpFavYon;

                        const url2 =
                            shopUrlAddr + "/v1/Shop/selectHsptDtl?shpId=" + shpId + "&shpDay=" + new Date().getDay();
                        let resData2 = await getAPI(url2);

                        deptList = resData2.resultVO.dept;
                        if (resData2.resultVO.hspt.length != 0) {
                            depts = resData2.resultVO.hspt[0].shpDepts;
                        }

                        dtrList = resData2.resultVO.dtr;
                        itemList = resData2.resultVO.item;
                        tdTime = resData2.resultVO.tdTime;
                        tdDtlTime = resData2.resultVO.tdDtlTime;

                        dtrList.forEach((dtr) => {
                            dtr.dgnsTime.sort((a, b) => {
                                const daysA = a.htmeDay.split(", "); // 쉼표로 구분된 요일을 분리
                                const daysB = b.htmeDay.split(", ");
                                const indexA = getLowestDayIndex(daysA);
                                const indexB = getLowestDayIndex(daysB);
                                return indexA - indexB;
                            });
                        });
                        const timeUrl = shopUrlAddr + "/v1/Shop/selectHsptTime?shpId=" + shpId;
                        let timeData = await getAPI(timeUrl);
                        hsptTime = timeData.resultVO;
                        const notiUrl = adminUrlAddr + "/v1/basicinfo/selectShpNotiList?shpId=" + shpId;
                        let notiData = await getAPI(notiUrl);
                        notiList = notiData.resultVO;
                    }
                }
            });
        } else {
            //가맹점이 아닌 경우
            agntId = $page.url.searchParams.get("agntId");
            const url =
                shopUrlAddr + "/v1/Shop/agntHsptDtl?shpId=" + agntId + "&shpDay=" + new Date().getDay() + "&shpType=H";
            let resData = await getAPI(url);
            shpDtl = resData.resultVO;
            depts = shpDtl.shpDepts;
            const deptUrl = shopUrlAddr + "/v1/Shop/selectAgntDepts?agntId=" + agntId;
            let deptData = await getAPI(deptUrl);
            deptList = deptData.resultVO;
            const timeUrl = shopUrlAddr + "/v1/Shop/selectAgentTime?shpId=" + agntId;
            let timeData = await getAPI(timeUrl);
            hsptTime = timeData.resultVO;
        }
        const nearDrstUrl =
            shopUrlAddr +
            "/v1/Shop/selectDrugStoreNear?shpLati=" +
            shpDtl.shpLati +
            "&shpLongi=" +
            shpDtl.shpLongi +
            "&shpDay=" +
            new Date().getDay();
        let drstData = await getAPI(nearDrstUrl);
        drstList = drstData.resultVO;
        call = "tel: " + shpDtl.shpTel;
        addMapScript(() => {
            makeDtlMap(shpDtl.shpLati, shpDtl.shpLongi, "hspt");
        });
        if (qrType == "true") {
            addFavHspt();
        }
    });

    function scrollMove(event) {
        const targetId = event.target.getAttribute("data-id");
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }
    //닫기 버튼
    function xButton() {
        resvPopUp = false;
    }
    //닫기 버튼
    function xPopButton() {
        popUp = false;
    }
    //진료 예약 팝업
    function doReg() {
        setHsptType();
        chkHsptHday();
        resvPopUp = true;
    }
    //자식 component에서 이벤트 발생 시 함수 실행
    const dgnsEvent = (event) => {
        $dgnsType = setDgnsType;
        $wlkYon = "Y";
        goto(urlList.uaDgnsTdRgst + "?shpId=" + shpId);
    };

    //자식 component에서 이벤트 발생 시 함수 실행
    const rsvEvent = (event) => {
        $dgnsType = setDgnsType;
        $wlkYon = "N";
        goto(urlList.uaDgnsRgst + "?shpId=" + shpId);
    };
    //접수/예약 가능한 타입 구하기
    async function setHsptType() {
        const getHspt = await getHsptType(shpId);
        hsptType = getHspt.hsptType;
        ctls = getHspt.ctls;
    }

    //병원 당일 휴무여부 구하기
    async function chkHsptHday() {
        timeData = await getHsptTime(shpId, setDgnsType);
    }

    //바로 병원 등록 팝업
    function addFav() {
        if (favChck == "Y") {
            addDelHspt();
        } else {
            addFavHspt();
        }
    }

    //바로병원 등록
    async function addFavHspt() {
        let jsonStr = makeStr({ shpId, mbrId: mbrId, favType: "H" });
        const url = /*urlAddr+ "8082*/ mobileUrlAddr + "/v1/favShop/addFav";
        let res = await postAPI(url, jsonStr, jwt);
        if (res.resultVO == true) {
            if (qrType != "true") {
                popUp = true;
            }
            favChck = "Y";
        }
    }
    //바로 삭제
    async function addDelHspt() {
        let jsonStr = makeStr({ shpId, mbrId });
        const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/favShop/delFav";
        let res = await postAPI(url, jsonStr, jwt);
        if (res.resultVO == true) {
            popUp = true;
            favChck = "N";
        }
    }
    // 요일 중 가장 작은 인덱스를 반환하는 함수
    function getLowestDayIndex(days) {
        const dayOrder = ["월", "화", "수", "목", "금", "토", "일"];
        const indexes = days.map((day) => dayOrder.indexOf(day));
        return Math.min(...indexes);
    }
    function getImg(imgUrl) {
        return "data:image/jpeg;base64," + imgUrl;
    }
</script>

<!-- content S -->
{#if shpDtl != null}
    <section class="location">
        <div>
            <h2>
                {shpDtl.shpName}
                <button type="button" title="뒤로가기" onclick="history.back();" class="back" />
                {#if shpType == "shp"}
                    <button
                        type="button"
                        class={favChck == "Y" ? "mark_on" : "mark_off"}
                        on:click={addFav}
                        title="즐겨찾기"
                    />
                    <!-- 즐겨찾기 온 mark_off -> mark_on 으로 수정-->
                {/if}
            </h2>
        </div>
    </section>
    <div class="hos_info_top">
        <div class="box_hos">
            <div class="ti">
                <span>
                    <p class="ar">
                        {#if shpType == "shp"}
                            {#if shpVstYon == "Y"}
                                <span class="bat_faceY" />
                            {/if}
                            {#if shpCtlsYon == "Y"}
                                <span class="bat_faceN" />
                            {/if}
                        {/if}
                    </p>
                </span>
            </div>
            <div class="ti">
                <span>{shpDtl.shpName}</span>
            </div>
            <p class="dept">
                {#if depts != undefined}
                    {depts}
                {/if}
            </p>
            {#if shpType == "shp"}
                <p class="time">
                    <span>{getDow()}요일</span>
                    {#if tdTime != null && tdTime.shpWTime != null}
                        {tdTime.shpWTime}
                    {/if}
                    {#if tdTime != null && tdTime.shpLTime != null}
                        <span>점심시간</span> {tdTime.shpLTime}
                    {/if}
                </p>
            {:else}
                <p class="time">
                    <span>{getDow()}요일</span>
                    {#if shpDtl.shpWTime != null}
                        {shpDtl.shpWTime}
                    {/if}
                    {#if shpDtl.shpLTime != null}
                        <span>점심시간</span> {shpDtl.shpLTime}
                    {/if}
                </p>{/if}
        </div>
        {#if shpType == "shp"}
            <button
                type="button"
                id="res_btn"
                on:click={() => {
                    shpCtlsYon = shpDtl.shpCtlsYon;
                    shpVstYon = shpDtl.shpVstYon;
                    doReg(shpDtl.shpId);
                }}>진료 접수 / 예약</button
            >
        {/if}
        {#if shpType == "agnt"}
            <button type="button" id="res_btn">남원 e케어가 도입되지 않은 병원입니다. </button>
        {/if}
    </div>
    <div class="info_tap">
        <div>
            <div class="tab" id="scrollMove">
                <button type="button" class="on" data-id="#move1" on:click={scrollMove}>병원정보</button>
                <button type="button" data-id="#move2" on:click={scrollMove}>진료정보</button>
                {#if shpType == "shp"}
                    <button type="button" data-id="#move3" on:click={scrollMove}>의사정보</button>
                {/if}
                <button type="button" data-id="#move4" on:click={scrollMove}>근처약국</button>
            </div>
        </div>
    </div>
    <section class="contents">
        {#if shpType == "shp"}
            {#if (shpDtl.shpIntrCnts != null && shpDtl.shpIntrCnts.length != 0) || (shpDtl.shpIntrTitl != null && shpDtl.shpIntrTitl.length != 0)}
                <h3 id="move1">병원소개</h3>
                <div class="box_1" style="white-space: pre-wrap">
                    {#if shpDtl.shpIntrTitl != null && shpDtl.shpIntrTitl.length != 0}
                        <div class="tit">{shpDtl.shpIntrTitl}</div>
                    {/if}
                    {#if shpDtl.shpIntrCnts != null && shpDtl.shpIntrCnts.length != 0}
                        <p>{shpDtl.shpIntrCnts}</p>
                    {/if}
                </div>
            {/if}
        {/if}
        {#if shpDtl.shpTel != null}
            <h3>전화번호</h3>
            <div class="box_1">
                {shpDtl.shpTel}
                <div class="ar">
                    <button type="button" class="mbtn_n_1" on:click={getCall(shpDtl.shpTel)}>전화하기</button>
                </div>
            </div>
        {/if}

        {#if shpType == "shp"}
            <h3>진료시간</h3>
            {#if tdTime != null && tdTime.shpWTime != null}
                <div class="box_2">
                    <dl>
                        <dt>{getDow()}요일</dt>
                        {#each tdDtlTime.work as workTime}
                            <dd>
                                {workTime.htmeFrom} ~ {workTime.htmeTo}
                                {#if workTime.htmeCtlsYon == "N" && workTime.htmeVstYon == "N"}(접수마감){/if}
                            </dd>
                        {/each}
                    </dl>
                    {#if tdDtlTime.lnch.length != 0}
                        <dl>
                            <dt>점심시간</dt>
                            {#each tdDtlTime.lnch as lnchTime}
                                <dd>{lnchTime.htmeFrom} ~ {lnchTime.htmeTo}</dd>
                            {/each}
                        </dl>
                    {/if}
                    <!-- <dl>
            <dt>{getDow()}요일</dt>
            <dd>{tdTime.shpWTime}</dd>
          </dl>

          {#if tdTime.shpLTime != null}
            <dl>
              <dt>점심시간</dt>
              <dd>{tdTime.shpLTime}</dd>
            </dl>
          {/if} -->
                </div>
            {:else}
                <div class="box_2">
                    <dl>
                        <dt>{getDow()}요일</dt>
                        <dd>휴무</dd>
                    </dl>
                </div>
            {/if}
        {:else if shpDtl.shpWTime != null && shpDtl.shpWTime != ""}
            <div class="box_2">
                <dl>
                    <dt>{getDow()}요일</dt>
                    <dd>{shpDtl.shpWTime}</dd>
                </dl>

                {#if shpDtl.shpLTime != null}
                    <dl>
                        <dt>점심시간</dt>
                        <dd>{shpDtl.shpLTime}</dd>
                    </dl>
                {/if}
            </div>
        {/if}
        {#if shpType == "shp"}
            <div class="box_2">
                {#each hsptTime as hsTime, count}
                    <dl>
                        {#if count == 5}
                            <dt class="txt_blue">{hsTime.htmeDay}요일</dt>
                        {:else if count == 6}
                            <dt class="txt_red">{hsTime.htmeDay}요일</dt>
                        {:else}
                            <dt>{hsTime.htmeDay}요일</dt>
                        {/if}
                        {#if hsTime.htmeFrom != null}
                            <dd>{hsTime.htmeFrom} ~ {hsTime.htmeTo}</dd>
                        {:else}
                            <dd>휴무</dd>
                        {/if}
                    </dl>
                {/each}
            </div>
        {:else if hsptTime.timeYon == "Y"}
            <h3>진료시간</h3>
            <div class="box_2">
                <dl>
                    <dt>월요일</dt>
                    {#if hsptTime.wtimeMon == "" || hsptTime.wtimeMon == null}
                        <dd>휴무</dd>
                    {:else}
                        <dd>{hsptTime.wtimeMon}</dd>
                    {/if}
                </dl>
                <dl>
                    <dt>화요일</dt>
                    {#if hsptTime.wtimeTue == "" || hsptTime.wtimeTue == null}
                        <dd>휴무</dd>
                    {:else}
                        <dd>{hsptTime.wtimeTue}</dd>
                    {/if}
                </dl>
                <dl>
                    <dt>수요일</dt>
                    {#if hsptTime.wtimeWed == "" || hsptTime.wtimeWed == null}
                        <dd>휴무</dd>
                    {:else}
                        <dd>{hsptTime.wtimeWed}</dd>
                    {/if}
                </dl>
                <dl>
                    <dt>목요일</dt>
                    {#if hsptTime.wtimeThu == "" || hsptTime.wtimeThu == null}
                        <dd>휴무</dd>
                    {:else}
                        <dd>{hsptTime.wtimeThu}</dd>
                    {/if}
                </dl>
                <dl>
                    <dt>금요일</dt>
                    {#if hsptTime.wtimeFri == "" || hsptTime.wtimeFri == null}
                        <dd>휴무</dd>
                    {:else}
                        <dd>{hsptTime.wtimeFri}</dd>
                    {/if}
                </dl>
                <dl>
                    <dt class="txt_blue">토요일</dt>
                    {#if hsptTime.wtimeSat == "" || hsptTime.wtimeSat == null}
                        <dd>휴무</dd>
                    {:else}
                        <dd>{hsptTime.wtimeSat}</dd>
                    {/if}
                </dl>
                <dl>
                    <dt class="txt_red">일요일</dt>
                    {#if hsptTime.wtimeSun == "" || hsptTime.wtimeSun == null}
                        <dd>휴무</dd>
                    {:else}
                        <dd>{hsptTime.wtimeSun}</dd>
                    {/if}
                </dl>
            </div>
        {/if}
        <h3>위치정보</h3>

        <div class="box_1">
            <p class="text1">
                {shpDtl.shpAddr}
                {#if shpDtl.shpAddrDtl != null}{shpDtl.shpAddrDtl}{/if}
            </p>

            <!-- <p><span class="matro_1" /><span class="matro_7" /> 가산디지털단지</p> -->
            <!-- .matro_1 : 1호선, .matro_2 : 2호선, .matro_3 : 3호선, .matro_4 : 4호선, .matro_5 : 5호선, .matro_6 : 6호선, .matro_7 : 7호선, .matro_8 : 8호선, .matro_9 : 9호선, .matro_n1 인천1호선, .matro_n2 인천2호선, .matro_n3 수인분당호선, .matro_n4 신분당, .matro_n5 경의중앙, .matro_n6 공항철도, .matro_n7 경춘선, .matro_n8 의정부경전철선, .matro_n9 용인경전철, .matro_n10 : 경강선, .matro_n11 : 우이신설경전철, .matro_n12 : 서해선, .matro_n13 : 김포도시철도, .matro_n14 : 신림선 -->
            <div class="map_wrap">
                <div id="map" />
                <button
                    type="button"
                    class="mbtn_t_2b"
                    on:click={() => {
                        goMap(
                            "https://map.kakao.com/link/map/" +
                                shpDtl.shpName +
                                "," +
                                shpDtl.shpLati +
                                "," +
                                shpDtl.shpLongi
                        );
                    }}
                >
                    지도보기
                </button>
            </div>
        </div>

        <h3 id="move2">진료과목</h3>
        <div class="box_1">
            <p class="tit1">총 {deptList.length}개</p>
            <div>
                {#each deptList as dept}
                    <span class="mbtn_b">{dept.deptName}</span>
                {/each}
            </div>
        </div>

        {#if shpType == "shp"}
            <h3>진료항목</h3>
            <div class="box_1">
                {#each itemList as item}
                    <span class="mbtn_b">{item.itemName}</span>
                {/each}
            </div>

            <!-- <h3>보유장비</h3>
  <div class="box_1">자기공명촬영기(MRI), 컴퓨터 단층 촬영기(CT)</div> -->

            <h3 id="move3">의사정보</h3>
            <div class="box_1">
                <p class="tit1">전문의 {dtrList.length}명</p>
                <!-- 의사 정보 S -->
                {#each dtrList as dtr}
                    <div class="doctor">
                        {#if dtr.dtrImg != null && dtr.dtrImg != ""}
                            <img src={getImg(dtr.dtrImg)} class="img" alt="." />
                        {:else if dtr.dtrGender == "F"}
                            <img
                                src={new URL("$lib/img/barodoctor/doctor_6.png", import.meta.url).href}
                                class="img"
                                alt="."
                            />
                        {:else}
                            <img
                                src={new URL("$lib/img/barodoctor/doctor_0.png", import.meta.url).href}
                                class="img"
                                alt="."
                            />
                        {/if}
                        <div class="text">
                            <p class="name">{dtr.dtrName} 선생님</p>
                            <p>
                                {#if dtr.dtrDepts != null}
                                    진료분야 :
                                    {dtr.dtrDepts}<br />
                                {/if}
                                {#each dtr.dgnsTime as dt}
                                    <p>
                                        {dt.htmeDay}:
                                        {#if dt.htmeFrom == null && dt.htmeTo == null}
                                            휴무
                                        {:else}
                                            {dt.htmeFrom} ~ {dt.htmeTo}
                                        {/if}
                                    </p>
                                {/each}
                                {getDow()}요일 비대면 진료시간
                                {#if dtr.dgnsCtlsTime.length != 0}
                                    {#each dtr.dgnsCtlsTime as ctls}
                                        <p>
                                            {ctls.htmeFrom} ~ {ctls.htmeTo}
                                        </p>
                                    {/each}
                                {:else}
                                    <p style="color: red;">휴무</p>
                                {/if}
                                {getDow()}요일 대면 진료시간
                                {#if dtr.dgnsVstTime.length != 0}
                                    {#each dtr.dgnsVstTime as vst}
                                        <p>
                                            {vst.htmeFrom} ~ {vst.htmeTo}
                                        </p>
                                    {/each}
                                {:else}
                                    <p style="color: red;">휴무</p>
                                {/if}
                            </p>
                        </div>
                    </div>
                {/each}

                <!-- 의사 정보 E -->
            </div>
        {/if}
        <h3 id="move4">근처약국</h3>
        <!-- 약국 S -->
        {#each drstList as drst}
            <div class="box_1 drug">
                <!-- <button type="button" class="mark_off" title="즐겨찾기" /> -->
                <p class="tit">{drst.shpName}</p>
                <p>
                    {drst.shpAddr}<br />
                    {#if drst.shFrom != null}
                        영업시간 {drst.shFrom} ~ {drst.shTo}
                    {/if}
                </p>
                <p class="btn_wrap">
                    <button type="button" class="mbtn_t_1b" on:click={getCall(drst.shpTel)}>전화하기</button>
                    <button
                        type="button"
                        class="mbtn_t_2b"
                        on:click={() => {
                            goMap(
                                "https://map.kakao.com/link/map/" +
                                    drst.shpName +
                                    "," +
                                    drst.shpLati +
                                    "," +
                                    drst.shpLongi
                            );
                        }}>지도보기</button
                    >
                </p>
            </div>
        {/each}

        <!-- 약국 E -->
        {#if shpType == "shp"}
            {#if notiList.length > 0}
                <h3>공지사항</h3>
                <div class="list_box" id="noti">
                    {#each notiList as noti}
                        <button
                            type="button"
                            class="box_1 type_user"
                            on:click={() => {
                                goto(urlList.uaNtcDtl + "?ntcId=" + noti.ntcId + "&ntcType=" + noti.ntcType);
                            }}
                        >
                            <p class="tit">
                                {noti.ntcTitl}
                                {#if getNew(noti.ntcRegDttm)}<span class="new" />{/if}
                            </p>
                            <p class="data">
                                {#if noti.ntcType == "admin"}
                                    남원 E-케어
                                {:else}
                                    {noti.ntcType}
                                {/if}
                                {noti.ntcRegDttm.substring(2)}
                            </p>
                        </button>
                    {/each}
                </div>
            {/if}
        {/if}
        <h3>병원정보</h3>
        <div class="box_1">
            병원정보는 건강보험심사평가원에서 제공한 공공데이터(OPEN API 건강보험심사평가원_병원정보서비스 및
            건강보험심사평가원_의료기관별상세정보서비스), 병원에서 제공한 정보로 작성되었습니다.
        </div>
        <div style="padding:40px" />
    </section>

    <ResvPopUp
        {hsptType}
        bind:resvPopUp
        bind:setDgnsType
        bind:timeData
        bind:ctls
        {shpId}
        on:dgnsEvent={dgnsEvent}
        on:rsvEvent={rsvEvent}
    />

    <PopUp {popUp}>
        <slot
            ><span class="txt_blue">{shpDtl.shpName}</span>이<br />
            단골병원에 {#if favChck == "Y"}
                추가{:else}삭제{/if} 되었습니다.</slot
        >
        <slot name="btns">
            <p class="btn_wrap">
                <button type="button" class="mbtn_n_4" on:click={xPopButton}>확인</button>
                <button
                    type="button"
                    class="mbtn_n_5"
                    on:click={() => {
                        goto(urlList.uaFavHsptLst);
                    }}>단골병원 보기</button
                >
            </p>
            <p />
        </slot>
    </PopUp>
{/if}
