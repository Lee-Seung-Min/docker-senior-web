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
    import { getDtl, getMap } from "$lib/js/kakaoMap";
    import { getUserId } from "$lib/js/getUserId";
    import { getDow } from "$lib/js/dateFunction";
    import { pharmacyData } from "$lib/store/pharmacyData";
    import { getCall, goMap } from "$lib/js/phoneAction";
    import { addMapScript, makeDtlMap } from "$lib/js/mapFunction";
    let shpDtl = [];
    let shpId;
    let agntId;
    let shpType;
    let favChck;
    let mbrId;
    let favName;
    let favId;
    let jwt;
    let popUp = false;
    let call;
    let notiList = [];
    let drstTime = [];
    let dow;
    let todayTime = "";
    let week;
    onMount(async () => {
        const url = shopUrlAddr + "/v1/ppds/getPharmacy?pharmacyCode=" + $pharmacyData.pharmacyCode;
        let resData = await getAPI(url);
        shpDtl = resData.resultVO;
        console.log(shpDtl);
        call = "tel: " + shpDtl.phone;
        $footCheck = "";
        getTodayTime();
        dow = getDow();
        week = getWeekOfMonth(new Date());
        addMapScript(() => {
            makeDtlMap(shpDtl.coordinateX, shpDtl.coordinateY, "drst");
        });
    });

    //닫기 버튼
    function xPopButton() {
        popUp = false;
    }
    //바로 병원 등록 팝업
    function addFav(name, id) {
        favName = name;
        favId = id;
        if (favChck == "Y") {
            addDelHspt();
        } else {
            addFavHspt();
        }
    }

    //바로병원 등록
    async function addFavHspt() {
        let jsonStr = makeStr({ shpId: favId, mbrId: mbrId, favType: "D" });
        const url = /*urlAddr+ "8082*/ mobileUrlAddr + "/v1/favShop/addFav";
        let res = await postAPI(url, jsonStr, jwt);
        if (res.resultVO == true) {
            popUp = true;
            favChck = "Y";
        }
    }
    //바로 삭제
    async function addDelHspt() {
        let jsonStr = makeStr({ shpId: favId, mbrId });
        const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/favShop/delFav";
        let res = await postAPI(url, jsonStr, jwt);
        if (res.resultVO == true) {
            popUp = true;
            favChck = "N";
        }
    }

    function getLaucnTime(e) {
        let openTime = "";
        if (e.startTime != null && e.startTime != "") {
            openTime = e.startTime.slice(0, 5) + " ~ " + e.endTime.slice(0, 5);
        } else {
            openTime = "휴무";
        }
        return openTime;
    }
    function getWeekendTime(e) {
        let openTime = "";
        if (e[week] != null && e[week] != "" && e[week] != undefined) {
            openTime = e[week].startTime.slice(0, 5) + " ~ " + e[week].endTime.slice(0, 5);
        } else {
            openTime = "휴무";
        }
        return openTime;
    }

    function getWeekOfMonth(date) {
        var firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        var firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay();
        var offsetDate = date.getDate() + firstDayOfWeek - 1;
        return Math.ceil(offsetDate / 7);
    }

    function getTodayTime() {
        if ($pharmacyData.startTime != null && $pharmacyData.startTime != "") {
            todayTime = $pharmacyData.startTime.slice(0, 5) + " ~ " + $pharmacyData.endTime.slice(0, 5);
        } else {
            todayTime = "휴무";
        }
    }
    function xButton() {
        popUp = false;
    }
</script>

<Nav>{shpDtl.name}</Nav>

<div class="hos_info_top">
    <div class="box_hos">
        <div class="tit">
            <span>{shpDtl.name}</span>
        </div>
        <p class="dept">
            {shpDtl.address1}
            {#if shpDtl.address2 != null}{shpDtl.address2}{/if}
        </p>
        <p class="time">
            <span>{dow}요일</span>
            {todayTime}
        </p>
    </div>
</div>
<section class="contents">
    <h3>영업시간</h3>
    <div class="box_2">
        <dl>
            <dt>평일</dt>
            {#if shpDtl.operation?.weekday}
                {getLaucnTime(shpDtl.operation.weekday)}
            {/if}
        </dl>
        <dl>
            <dt class="txt_blue">토요일</dt>
            {#if shpDtl.operation?.saturday}
                {getWeekendTime(shpDtl.operation.saturday)}
            {/if}
        </dl>
        <dl>
            <dt class="txt_red">일요일</dt>
            {#if shpDtl.operation?.sunday}
                {getWeekendTime(shpDtl.operation.sunday)}
            {/if}
        </dl>
        <dl>
            <dt class="txt_red">공휴일</dt>
            {#if shpDtl.operation?.holiday}
                {getWeekendTime(shpDtl.operation.holiday)}
            {/if}
        </dl>
    </div>

    <h3>전화번호</h3>
    <div class="box_1">
        {shpDtl.phone}
        <div class="ar">
            <button type="button" class="mbtn_n_1" on:click={getCall(shpDtl.phone)}>전화하기</button>
        </div>
    </div>
    <!-- <h3>보유장비</h3>
    <div class="box_1">혈압기, 안마기</div> -->

    <h3>위치정보</h3>
    <div class="box_1">
        <p class="text1">
            {shpDtl.address1}
            {#if shpDtl.address2 != null}{shpDtl.address2}{/if}
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
                            shpDtl.name +
                            "," +
                            shpDtl.coordinateX +
                            "," +
                            shpDtl.coordinateY
                    );
                }}
            >
                지도보기
            </button>
        </div>
    </div>
    {#if shpDtl.enableYn == "Y"}
        <div style="padding:50px" />
        <div class="bottom_btn_fixed">
            <button
                type="button"
                class="newReg"
                id="new"
                on:click={() => {
                    if (shpDtl.enableYn == "Y") {
                        goto(urlList.uaPspnRgst1);
                    } else {
                        popUp = true;
                    }
                }}
                value="어느 방식을 선택하시겠습니까?"
            >
                처방전전송
            </button>
        </div>
    {/if}
</section>
<PopUp {popUp}>
    <slot>
        <p>
            처방전 전달이 불가능 합니다. <button type="button" class="alert_close" on:click={xButton}
                ><i class="xi-close-min" /></button
            >
        </p>
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
        <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={xButton}>확인</button>
    </p>
    <p />
</PopUp>
