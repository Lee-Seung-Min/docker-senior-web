<script>
    // @ts-nocheck

    import { onMount } from "svelte";
    import PageLoader from "$lib/sub/PageLoader.svelte";
    import PopUp from "$lib/sub/nav/PopUp.svelte";
    import SearchNav from "$lib/sub/nav/SearchNav.svelte";
    import { goto } from "$app/navigation";
    import { urlList } from "$lib/urlList";
    import { getAPI } from "$lib/js/getAPI";
    import { makeStr } from "$lib/js/makeStr";
    import { postAPI } from "$lib/js/postAPI";
    import { page } from "$app/stores";
    import { footCheck } from "$lib/store/navStore.js";
    import { chngDateTimeSecondsFormat, getDow } from "$lib/js/dateFunction";
    import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
    import { dgnsType, wlkYon } from "$lib/store/rgstStore.js";
    import { searchType, searchData, searchWhat, searchMount } from "$lib/store/search";
    import { getUserId } from "$lib/js/getUserId";
    import { isLogin } from "$lib/store/loginStore";
    import ResvPopUp from "$lib/sub/nav/ResvPopUp.svelte";
    import { updateRefresh } from "$lib/js/updateRefresh";
    import { getHsptType } from "$lib/js/getHsptType";
    import { getHsptTime } from "$lib/js/getHsptTime";
    import { chngDistance } from "$lib/js/chngDistance";
    import { getOsType } from "$lib/js/phoneAction";
    import { listUserLocation } from "$lib/store/userLocation";
    import cryptoJs from "crypto-js";
    import { decrypt, encrypt, getEncryptItems } from "$lib/js/aes256";

    let isLoading = false;
    let hsptList = [];
    let lat = "";
    let lon = "";
    let popUp = false;
    let resvPopUp = false;
    let popUpWhat = "";
    let favShpId;
    let shpPage = 0;
    let containerRef;
    let noMore = false;
    let date = new Date();
    let type = "";
    let mbrId = 0;
    let hsptShpId;
    let shpCtlsYon;
    let shpVstYon;
    let isFirstSearch = true;
    let setDgnsType;
    let hsptType = { ctlsDgns: false, ctlsRsv: false, vstDgns: false, vstRsv: false, ctls: false, visit: false };
    let timeData = { vacation: false, U: false, V: false, W: false, R: false };
    let searchNothing = false;
    let ctls = false;
    // Intersection Observer 설정
    let sentinel;
    let observer;
    let jwt;
    let encShpLati;
    let encShpLongi;
    let encryptItems = [];
    onMount(async () => {
        jwt = localStorage.getItem("userJwt");
        const refresh = localStorage.getItem("refreshJwt");
        try {
            //사용자 id를 가져온다.
            await getUserId(jwt).then((result) => {
                //id를 가져온 후의 로직을 작성.
                if (result != "" && result != undefined && result != "") {
                    mbrId = result;
                    $footCheck = "menu1";
                    $searchType = "H";
                    searchMount.subscribe((value) => {
                        if (value && isFirstSearch) {
                            search();
                            isFirstSearch = false; // 첫 번째 검색 후에는 다음 검색을 막음
                            observer = new IntersectionObserver((entries) => {
                                if (entries[0].isIntersecting) {
                                    // 스크롤이 일정 위치에 도달하면 추가 데이터 불러오기
                                    if (!noMore) {
                                        loadMoreData();
                                    }
                                }
                            });
                            if (sentinel) observer.observe(sentinel);
                        }
                    });
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

    //검색
    async function search() {
        isLoading = true;
        noMore = true;
        shpPage = 0;
        let url;
        encryptItems = getEncryptItems();
        encShpLongi = encrypt(lon, encryptItems);
        encShpLati = encrypt(lat, encryptItems);

        // @ts-ignore
        dgnsType.subscribe((value) => {
            //비대면 or 방문 진료인지
            if (value == "V") {
                type = "V";
            } else if (value == "U") {
                type = "U";
            } else {
                type = "";
            }
        });
        let jsonStr = getSearchJson();
        url =
            /*urlAddr +
                    "8080*/ shopUrlAddr + "/v1/Shop/selectHsptListMobileNew";

        var res = await postAPI(url, jsonStr);
        hsptList = res.resultVO;
        noMore = false;
        if (hsptList.length == 0) {
            searchNothing = true;
        }
        isLoading = false;
    }

    //바로 병원 등록 팝업
    function addFav(e) {
        popUp = true;
        favShpId = e;
        popUpWhat = "fav";
    }

    //바로병원 등록
    async function addFavHspt() {
        let jsonStr = makeStr({ shpId: favShpId, mbrId: mbrId, favType: "H" });
        const url = /*urlAddr+ "8082*/ mobileUrlAddr + "/v1/favShop/addFav";
        let res = await postAPI(url, jsonStr, jwt);
        if (res.resultVO == true) {
            popUp = false;
            search();
        }
    }

    //닫기 버튼
    function xButton() {
        popUp = false;
    }

    //자식 component에서 이벤트 발생 시 함수 실행
    const searchHspt = (event) => {
        hsptList = [];
        search();
    };

    //페이징 처리 추가 데이터 불러 오게
    async function loadMoreData() {
        shpPage += 1;
        let url;
        let jsonStr = getSearchJson();
        url =
            /*urlAddr +
                    "8080*/ shopUrlAddr + "/v1/Shop/selectHsptListMobileNew";

        let resData = await postAPI(url, jsonStr);
        let newData = resData.resultVO;
        if (newData.length == 0) {
            noMore = true;
        }
        hsptList = [...hsptList, ...newData];
    }

    //진료 예약 팝업
    function doReg(e) {
        popUpWhat = "reg";
        hsptShpId = e;
        setHsptType();
        chkHsptHday();
        resvPopUp = true;
    }

    //자식 component에서 이벤트 발생 시 함수 실행
    const dgnsEvent = (event) => {
        $dgnsType = setDgnsType;
        $wlkYon = "Y";
        goto(urlList.uaDgnsTdRgst + "?shpId=" + hsptShpId);
    };

    //자식 component에서 이벤트 발생 시 함수 실행
    const rsvEvent = (event) => {
        $dgnsType = setDgnsType;
        $wlkYon = "N";
        goto(urlList.uaDgnsRgst + "?shpId=" + hsptShpId);
    };

    //접수/예약 가능한 타입 구하기
    async function setHsptType() {
        const getHspt = await getHsptType(hsptShpId);
        hsptType = getHspt.hsptType;
        ctls = getHspt.ctls;
    }

    //병원 당일 휴무여부 구하기
    async function chkHsptHday() {
        timeData = await getHsptTime(hsptShpId, setDgnsType);
    }

    //검색 json
    function getSearchJson() {
        if ($listUserLocation) {
            return makeStr({
                shpDay: date.getDay(),
                encShpLati,
                encShpLongi,
                searchWhat: $searchWhat,
                searchData: $searchData,
                shpPage,
                locOs: getOsType(),
                locUseDttm: chngDateTimeSecondsFormat(new Date()),
                locUse: true,
            });
        } else {
            return makeStr({
                shpDay: date.getDay(),
                encShpLati,
                encShpLongi,
                searchWhat: $searchWhat,
                searchData: $searchData,
                shpPage,
                locUse: false,
            });
        }
    }
</script>

<SearchNav bind:lat bind:lon on:searchHspt={searchHspt} />
<!-- 
<section class="contents scr" on:scroll={handleScroll} bind:this={containerRef}> -->
<section class="contents">
    {#if isLoading}
        <PageLoader />
    {:else}
        <!-- 병원 리스트 S -->
        {#each hsptList as hspt}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                class="box_hos"
                on:click={() => {
                    if (hspt.shpYon == "Y") {
                        goto(urlList.uaHptDtl + "?shpId=" + hspt.shpId + "&shpType=shp");
                    } else {
                        goto(urlList.uaHptDtl + "?agntId=" + hspt.agntId + "&shpType=agnt");
                    }
                }}
            >
                {#if hspt.shpFavYon == "Y"}
                    <div class="ti">
                        <span>
                            <p class="ar">
                                <span class="bat_favhos" />
                                <!--{:else}
                                        <span class="bat_visithos" />-->
                            </p>
                        </span>
                    </div>
                {/if}
                <div class="ti">
                    <span>{hspt.shpName}</span>
                </div>
                <p class="dept">{hspt.shpDepts}</p>
                <p class="time">
                    <span>{getDow()}요일</span>
                    {#if hspt.shpWTime == null}
                        휴무
                    {:else}
                        {hspt.shpWTime}
                        {#if hspt.shpLTime != null}<span>점심시간</span>
                            {hspt.shpLTime}
                        {/if}
                    {/if} <br />
                    {hspt.shpAddr}
                    {hspt.shpAddrDtl} | {chngDistance(hspt.shpDist)}
                </p>
                {#if hspt.shpId != null}
                    <div class="btn_wrap inline">
                        {#if hspt.shpFavYon == "N"}
                            <button
                                type="button"
                                class="btn_04"
                                id="show"
                                value="단골병원으로 추가하시겠습니까?"
                                on:click|stopPropagation={addFav(hspt.shpId)}
                                >단골병원 추가
                            </button>
                        {/if}

                        <button
                            type="button"
                            on:click|stopPropagation={() => {
                                shpCtlsYon = hspt.shpCtlsYon;
                                shpVstYon = hspt.shpVstYon;
                                doReg(hspt.shpId);
                            }}
                            class="btn_01"
                            >진료 접수 / 예약
                        </button>
                    </div>
                {/if}
                {#if hspt.shpId == null}
                    <button type="button" class="btn_04" id="show" style="color: black;"
                        >남원 E-케어가 도입되지 않은 병원입니다.
                    </button>
                {/if}
            </div>
        {/each}
        {#if searchNothing}
            <div class="box_hos">
                <span>해당하는 병원이 없습니다.</span>
            </div>
        {/if}
    {/if}
    <div bind:this={sentinel} />
</section>
{#if popUpWhat == "fav"}
    <PopUp {popUp}>
        <slot
            >단골병원으로 추가하시겠습니까?
            <button type="button" class="alert_close" on:click={xButton}><i class="xi-close-min" /></button>
        </slot>
        <p slot="btns" class="btn_wrap" id="btn">
            <button type="button" class="mbtn_n_4" name="chbtn" id="close" on:click={addFavHspt}>예</button>
            <button type="button" class="mbtn_n_9" name="chbtn" id="close" on:click={xButton}>아니오</button>
        </p>
        <p />
    </PopUp>
{:else if popUpWhat == "reg"}
    <ResvPopUp
        {hsptType}
        bind:resvPopUp
        bind:setDgnsType
        bind:timeData
        bind:ctls
        on:dgnsEvent={dgnsEvent}
        on:rsvEvent={rsvEvent}
        shpId={hsptShpId}
    />
{/if}
