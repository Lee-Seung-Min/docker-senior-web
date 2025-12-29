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
    import { drcpShpId } from "$lib/store/pspnStore.js";
    import SearchNav from "$lib/sub/nav/SearchNav.svelte";
    import { searchType, searchData, searchWhat, searchMount } from "$lib/store/search";
    import { pharmacyData } from "$lib/store/pharmacyData";
    import PageLoader from "$lib/sub/PageLoader.svelte";
    import { getOsType } from "$lib/js/phoneAction";
    import { listUserLocation } from "$lib/store/userLocation";
    import cryptoJs from "crypto-js";
    import { decrypt, encrypt, getEncryptItems } from "$lib/js/aes256";
    import { chngDateTimeSecondsFormat } from "$lib/js/dateFunction";
    import { drcpPspnId } from "$lib/store/pspnStore.js";

    let drstList = [];
    let favDrst = [];
    let popUp = false;
    let popUp2 = false;
    let lat = "";
    let lon = "";
    let shpPage = 1;
    let noMore = false;
    let isFirstSearch = true;
    let week = 0;
    let isLoading = true;
    // Intersection Observer 설정
    let sentinel;
    let observer;
    let encShpLati;
    let encShpLongi;
    let encDistance;
    let encryptItems = [];

    onMount(async () => {
        $footCheck = "menu2";
        $searchType = "P";

        search();

        // searchMount.subscribe((value) => {
        //   if (value && isFirstSearch) {
        //     console.log(111);

        //     week = getWeekOfMonth(new Date()) - 1;
        //     isFirstSearch = false; // 첫 번째 검색 후에는 다음 검색을 막음
        //     observer = new IntersectionObserver((entries) => {
        //       if (entries[0].isIntersecting) {
        //         // 스크롤이 일정 위치에 도달하면 추가 데이터 불러오기
        //         if (!noMore) {
        //           loadMoreData();
        //         }
        //       }
        //     });
        //     if (sentinel) observer.observe(sentinel);
        //   }
        // });
    });
    //팝업 닫기
    function xButton() {
        popUp = false;
    }

    function close() {
        popUp2 = false;
        goto(urlList.uaPspnLst);
    }

    //거리 구하기
    function distance(e) {
        if (e >= 1000) {
            return (e / 1000).toString().slice(0, 4) + "km";
        } else {
            return e + "m";
        }
    }
    //검색
    async function search() {
        noMore = true;
        isLoading = true;
        console.log("search1!!");
        console.log(lat, lon);
        let url = authUrlAddr + "/v1/ppds/ext/distanceToPharm?ppdsId=" + $drcpPspnId;
        drstList = await getAPI(url);
        console.log(drstList);
        noMore = false;
        isLoading = false;
    }
    //자식 컴포넌트에서 이벤트 발생 시 함수 실행
    const searchDrst = (event) => {
        console.log("searchDrst");
        search();
    };

    function isTimeBetween(startTime, endTime) {
        const now = new Date();

        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        const currentTime = `${h}:${m}:${s}`;

        //비교 로직
        if (startTime <= endTime) {
            //현재 시간이 시작 시간보다 크고, 끝 시간보다 작아야 함(예: 09:00 ~ 18:00)
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            //현재 시간이 시작 시간보다 크거나, 끝 시간보다 작으면 됨(예: 22:00 ~ 02:00)
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    async function sendFax(faxNumber) {
        let newFaxNum = faxNumber.replace(/-/g, "");
        let url = shopUrlAddr + "/webfax/sendFax?pspnId=" + $drcpPspnId + "&toNumber=" + newFaxNum;

        try {
            isLoading = true;
            const result = await postAPI(url, null, localStorage.getItem("userJwt"));
            console.log(result);
            if (result.code == 0) {
                isLoading = false;
                popUp2 = true;
            }
        } catch (error) {}
    }

    //페이징 처리 추가 데이터 불러 올 수 있게
    // async function loadMoreData() {
    //   shpPage += 1;
    //   const url = shopUrlAddr + "/v1/ppds/getPharmacyList";
    //   let jsonStr = getSearchJson();
    //   let resData = await postAPI(url, jsonStr);
    //   let newData = resData.resultVO;
    //   if (newData.length == 0) {
    //     noMore = true;
    //   }
    //   console.log(newData);
    //   drstList = [...drstList, ...newData];
    // }
    //검색 json
    // function getSearchJson() {
    //   if ($listUserLocation) {
    //     return makeStr({
    //       encCoordinateY: encShpLati,
    //       encCoordinateX: encShpLongi,
    //       encDistance,
    //       paging: shpPage,
    //       locOs: getOsType(),
    //       locUseDttm: chngDateTimeSecondsFormat(new Date()),
    //       locUse: true,
    //     });
    //   } else {
    //     return makeStr({
    //       encCoordinateY: encShpLati,
    //       encCoordinateX: encShpLongi,
    //       encDistance,
    //       paging: shpPage,
    //       locUse: false,
    //     });
    //   }
    // }
    // function getWeekOfMonth(date) {
    //   var firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    //   var firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay();
    //   var offsetDate = date.getDate() + firstDayOfWeek - 1;
    //   return Math.ceil(offsetDate / 7);
    // }
    // function getLaucnTime(e) {
    //   let openTime = "";
    //   if (e.startTime != null && e.startTime != "") {
    //     openTime = e.startTime.slice(0, 5) + " ~ " + e.endTime.slice(0, 5);
    //   } else {
    //     openTime = "휴무";
    //   }
    //   return openTime;
    // }
</script>

<SearchNav bind:lat bind:lon on:searchDrst={searchDrst} />

<section class="contents">
    <div class="list_box" id="pre_list">
        {#if isLoading}
            <PageLoader />
        {:else}
            <!-- 약국 정보 S -->
            {#each drstList as drst}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="box_1">
                    <div class="pspnLst">
                        <p class="name">
                            {drst.shpName}
                        </p>

                        <p class="dept">{drst.sdtlAddr} | {drst.distance.toFixed(2)} km</p>
                        <p class="time">
                            <span>영업시간</span>
                            {#if drst.isWorkDayOfWeek == "1"}
                                {drst.startTime.substr(0, 5)} ~ {drst.endTime.substr(0, 5)}
                            {:else}
                                휴무중
                            {/if}
                        </p>
                    </div>
                    {#if drst.isWorkDayOfWeek == "1" && isTimeBetween(drst.startTime, drst.endTime)}
                        <button
                            type="button"
                            on:click|stopPropagation={() => {
                                if (drst.isWorkDayOfWeek == "1") {
                                    sendFax(drst.sdtlFax);
                                } else {
                                    popUp = true;
                                }
                            }}
                            class="btn_01">처방전 보내기</button
                        >
                    {/if}
                </div>
            {/each}
            <!-- 약국 정보 E -->
        {/if}
    </div>

    <!-- <div bind:this={sentinel} /> -->
</section>

<PopUp popUp={popUp2}>
    <slot>
        <p>처방전이 전송되었습니다.<br />처방 목록 페이지로 이동합니다.</p>
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
        <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={close}>확인</button>
    </p>
    <p />
</PopUp>
