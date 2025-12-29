<script>
    // @ts-nocheck

    import { onMount, onDestroy } from "svelte";
    import PopUp from "$lib/sub/nav/PopUp.svelte";
    import Nav from "$lib/sub/nav/Nav.svelte";
    import { goto } from "$app/navigation";
    import { urlList } from "$lib/urlList";
    import { getAPI } from "$lib/js/getAPI";
    import { makeStr } from "$lib/js/makeStr";
    import { postAPI } from "$lib/js/postAPI";
    import { page } from "$app/stores";
    import { footCheck } from "$lib/store/navStore.js";
    import { dgnsType, wlkYon } from "$lib/store/rgstStore.js";
    import { searchType, searchData, searchWhat } from "$lib/store/search";
    import { mobileUrlAddr, adminUrlAddr } from "$lib/js/urlAddr";
    import { getUserId } from "$lib/js/getUserId";
    import { isLogin } from "$lib/store/loginStore";
    import { updateRefresh } from "$lib/js/updateRefresh";
    import { getCamera } from "$lib/js/phoneAction";
    import { chngDateFormat, getCurrentDay, getNew } from "$lib/js/dateFunction";
    import ResvPopUp from "$lib/sub/nav/ResvPopUp.svelte";
    import { getHsptType } from "$lib/js/getHsptType";
    import { getHsptTime } from "$lib/js/getHsptTime";
    import HealthList from "../../hlthinfo/uaMbrHlthLst/HealthList.svelte";
    let dgnsStat = "3";
    let page1 = 0;
    let dgnsList = [];
    //처방 선언
    let pspnLst = [];
    //공지 선언
    let notiList = [];
    //최근 방문 병원
    let latestShp = [];
    let slideIndex = 0;
    //접수예약 진료항목/진료과 선택 버튼
    let dgnsClick = "item";
    //진료목록 진행진료/최근진료 선택 버튼
    let whenDgns = "recent";
    //진행 진료
    let doDgns = [];
    //최근 진료
    let recDgns = [];
    let slideInterval;

    //접수/예약 관련
    let resvPopUp = false;
    let popUpWhat = "";
    let hsptType = { ctlsDgns: false, ctlsRsv: false, vstDgns: false, vstRsv: false, ctls: false, visit: false };
    let timeData = { vacation: false, U: false, V: false, W: false, R: false };
    let setDgnsType;
    let ctls = false;
    let dgnsShpId;

    const slides = [
        // {
        //     url: "/lib/img/manual/banner_03.png",
        //     bgColor: "#008179",
        //     clickUrl: urlList.uaManualVideo,
        // },
        {
            url: "/lib/img/manual/banner_02_1.png",
            bgColor: "#003c81",
            clickUrl: urlList.uaManual2,
        },
    ];

    onMount(async () => {
        $footCheck = "home"; //<body class="login menu1"> 위 부분 보고 설정 해줘야 메뉴바 변경
        const jwt = localStorage.getItem("userJwt");
        const refresh = localStorage.getItem("refreshJwt");
        try {
            //사용자 id를 가져온다.
            await getUserId(jwt).then(async (result) => {
                //id를 가져온 후의 로직을 작성.
                if (result != "" && result != undefined && result != "") {
                    showSlides();
                    const dgnsMbrId = result;

                    //진행중/최근 진료 목록
                    const dgnsUrl = mobileUrlAddr + "/v1/dgns/selectMbrHomeDgnsList";
                    let resData = await getAPI(dgnsUrl);
                    doDgns = resData.resultVO.doDgns;
                    recDgns = resData.resultVO.recDgns;
                    console.log(recDgns);

                    //공지
                    const url_g = adminUrlAddr + "/v1/basicinfo/uaNtctLst?page=0";
                    resData = await getAPI(url_g);
                    notiList = resData.resultVO;

                    //슬라이드 실행
                    slideInterval = setInterval(showSlides, 4000);
                }
            });
        } catch (err) {
            //에러가 토큰기간만료 코드라면 다시 재발급을 진행
            try {
                if (err.message == "21009") {
                    // await updateRefresh(refresh);
                    // location.reload();
                } else {
                    //아니라면 그냥 에러 출력.
                    // console.error(err);
                }
            } catch (err) {
                //토큰 재발급 과정에서 에러 발생 시, 다시 로그인하도록 로그인 화면으로 보낸다.
                // console.error(err);
                // localStorage.setItem("refreshJwt", "");
                // localStorage.setItem("userJwt", "");
                // alert("토큰 재발급 오류 발생. 다시 로그인해주세요");
                // $isLogin = false;
                // goto("/mbr/uaLogin");
            }
        }
    });

    onDestroy(() => {
        clearInterval(slideInterval);
    });

    // 두 날짜 사이의 날짜 차이 계산하는 함수
    function getDaysDifference(fromDate, toDate) {
        const oneDay = 1000 * 60 * 60 * 24;
        const timeDifference = toDate.getTime() - fromDate.getTime();
        const daysDifference = Math.round(timeDifference / oneDay);
        return daysDifference;
    }
    function beforeDay(e) {
        let date = new Date();
        let targetDate = new Date("20" + e);
        return getDaysDifference(date, targetDate);
    }
    let popUp = false;
    //팝업 닫기
    function xButton() {
        popUp = false;
    }

    function showSlides() {
        slideIndex = (slideIndex + 1) % slides.length;
    }

    function goQr() {
        getCamera((permission) => {
            if (permission) {
                console.log(permission);
                goto(urlList.uaQrCode);
            }
        });
    }
    function getTruncatedText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    }

    //진료 예약 팝업
    function doReg(e) {
        popUpWhat = "reg";
        dgnsShpId = e;
        setHsptType();
        chkHsptHday();
        resvPopUp = true;
    }

    //자식 component에서 이벤트 발생 시 함수 실행
    const dgnsEvent = (event) => {
        console.log("접수!!");
        $dgnsType = setDgnsType;
        $wlkYon = "Y";
        goto(urlList.uaDgnsTdRgst + "?shpId=" + dgnsShpId);
    };

    //자식 component에서 이벤트 발생 시 함수 실행
    const rsvEvent = (event) => {
        console.log("예약!!");
        $dgnsType = setDgnsType;
        $wlkYon = "N";
        goto(urlList.uaDgnsRgst + "?shpId=" + dgnsShpId);
    };

    //접수/예약 가능한 타입 구하기
    async function setHsptType() {
        const getHspt = await getHsptType(dgnsShpId);
        hsptType = getHspt.hsptType;
        ctls = getHspt.ctls;
    }

    //병원 당일 휴무여부 구하기
    async function chkHsptHday() {
        timeData = await getHsptTime(dgnsShpId, setDgnsType);
    }
</script>

<!-- content S -->
<main>
    <div class="slide_wrap" style="background-color: #fbf9f9;">
        <div class="slide_list">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            {#each slides as slide, i}
                <div
                    class="slide {slideIndex === i ? 'active' : ''}"
                    style="background-image:url({slide.url}); background-color:{slide.bgColor}"
                    on:click={() => goto(slide.clickUrl)}
                ></div>
            {/each}
        </div>
    </div>
    <!-- 메인 컨텐츠 로그인 후 S -->
    <div class="main_con login">
        <!-- <button
      class="btn_05"
      type="button"
      on:click={() => {
        goto(urlList.uaHlShpLst);
      }}
    >
      <p>추석 연휴 이용 가능한 병원/약국</p>
    </button>
    <br />
    <br /> -->
        <!-- 예약목록  -->
        <div class="res_wrap">
            <!-- 방문 예약정보 S -->
            <!-- 방문 예약정보 E -->
            <!-- 비대면 예약정보 S -->
            <div>
                <div class="tab_wrap">
                    <button
                        type="button"
                        class={whenDgns == "doing" ? "on" : ""}
                        on:click={() => {
                            whenDgns = "doing";
                        }}>진행진료</button
                    >
                    <button
                        type="button"
                        class={whenDgns == "recent" ? "on" : ""}
                        on:click={() => {
                            whenDgns = "recent";
                        }}>최근진료</button
                    >
                </div>
            </div>
            {#if whenDgns == "doing"}
                {#if doDgns != null && doDgns != undefined && doDgns.length != 0}
                    <button
                        class="res nonface"
                        type="button"
                        on:click={() => {
                            goto(urlList.uaDgnsDtl + "?dgnsId=" + doDgns.dgnsId);
                        }}
                    >
                        <div class="info">
                            <p class="data">{doDgns.dgnsRsvDttm}</p>
                            <p class="hos">
                                {doDgns.dgnsShpName}
                                {#if doDgns.dgnsType == "V"}
                                    <span class="bat_faceY" />
                                {:else if doDgns.dgnsType == "U"}
                                    <span class="bat_faceN" />
                                {/if}
                            </p>
                            <p class="name">{doDgns.dgnsPatName}<span>{doDgns.dgnsPatType}</span></p>
                        </div>
                        <div class="stat">
                            <p>예약일</p>
                            <p>{beforeDay(doDgns.dgnsRsvDttm)}<span>일 전</span></p>
                        </div>
                    </button>
                {:else}
                    <button class="res nonface" type="button">
                        <div class="info">
                            <p>진행중인 진료가 없습니다.</p>
                        </div>
                    </button>
                {/if}
            {:else if whenDgns == "recent"}
                {#if recDgns != null && recDgns != undefined && recDgns.length != 0}
                    <br />
                    <div class="list_box clinic_box">
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div
                            class="box_1"
                            on:click={() => {
                                goto(urlList.uaDgnsDtl + "?dgnsId=" + recDgns.dgnsId);
                            }}
                        >
                            <div class="dgnsLst">
                                <div class="thumb_box">
                                    <div class="thumb">
                                        <!-- <img src={new URL("$lib/img/barodoctor/hospital_00.png", import.meta.url).href} class="img" alt="." /> -->
                                        <img
                                            src={new URL("$lib/img/barodoctor/hospital_00.png", import.meta.url).href}
                                            class="img"
                                            alt="."
                                        />
                                    </div>
                                    <div class="btn_box">
                                        {#if recDgns.dgnsStat == 7 && (recDgns.mpayStat == 0 || recDgns.mpayStat == 7 || recDgns.mpayStat == 8 || recDgns.mpayStat == 9)}
                                            <button
                                                type="button"
                                                class="mbtn_s"
                                                id="show_reg"
                                                on:click|stopPropagation={() => {
                                                    goto(urlList.uaPayMbrDgns + "?dgnsId=" + recDgns.dgnsId);
                                                }}
                                                value="결제 하시겠습니까?">결제</button
                                            >
                                        {:else if recDgns.dgnsStat == 7 && recDgns.mpayStat == 5}
                                            <button
                                                type="button"
                                                class="mbtn_n"
                                                id="show_reg"
                                                on:click|stopPropagation={() => {
                                                    goto(urlList.uaPayMbrDgns + "?dgnsId=" + recDgns.dgnsId);
                                                }}
                                                value="결제 하시겠습니까?">결제완료</button
                                            >
                                        {/if}
                                    </div>
                                </div>
                                <div class="info_box">
                                    <div
                                        class="box2"
                                        style=" display: flex;
                            flex-wrap: nowrap;
                            align-items: center;
                            justify-content: flex-start; 
                            gap: 3px; 
                            overflow-x: auto;"
                                    >
                                        <span class="bat_state_after" />

                                        {#if recDgns.dgnsType == "V"}
                                            <span class="bat_faceY" />
                                        {:else if recDgns.dgnsType == "U"}
                                            <span class="bat_faceN" />
                                        {/if}
                                        {#if recDgns.favType == "H"}
                                            <span class="bat_favorite_hspt f_right" />
                                        {/if}
                                    </div>
                                    <p class="name">{recDgns.dgnsShpName}</p>
                                    <p class="subject">{recDgns.dgnsDeptName}</p>
                                    <p class="date">{recDgns.dgnsRsvDttm}</p>
                                    <div class="text_wrap">
                                        <p class="patient">
                                            {recDgns.dgnsPatName}<small>{recDgns.dgnsPatType}</small>
                                        </p>
                                        <button
                                            class="hspt"
                                            on:click|stopPropagation={() => {
                                                goto(urlList.uaHptDtl + "?shpId=" + recDgns.dgnsShpId + "&shpType=shp");
                                            }}>병원정보</button
                                        >
                                    </div>
                                </div>
                            </div>
                            <div class="list_box">
                                <button
                                    type="button"
                                    class="btn_01"
                                    style="height: fit-content;"
                                    on:click|stopPropagation={() => {
                                        doReg(recDgns.dgnsShpId);
                                    }}
                                >
                                    <div>최근진료 병원 바로 진료 접수/예약</div>
                                </button>
                            </div>
                        </div>
                    </div>
                {:else}
                    <button class="res nonface" type="button">
                        <div class="info">
                            <p>최근 진료가 없습니다.</p>
                        </div>
                    </button>
                {/if}
            {/if}
        </div>
        <br />
        <br />
        <div class="find">
            <button
                type="button"
                class="findHos"
                on:click={() => {
                    $searchType = "H";
                    $searchData = "";
                    $searchWhat = "A";
                    $dgnsType = "";
                    goto(urlList.uaHsptSrch);
                }}
            >
                <p />
                <div>병원 검색</div>
            </button>
            <button
                type="button"
                class="mad"
                on:click={() => {
                    $searchData = "";
                    goto(urlList.uaDrstSrchKw);
                }}
            >
                <p />
                <div>약국 검색</div>
            </button>
        </div>

        <div class="find">
            <button
                type="button"
                class="hos"
                on:click={() => {
                    goto(urlList.uaFavHsptLst);
                }}
            >
                <p />
                <div>단골 병원</div>
                <div style="font-size: 0.7rem; color:darkgray;line-height: 0.9rem ">자주 가는 병원을 등록하세요.</div>
            </button>
            <button
                type="button"
                class="qrCode"
                on:click={() => {
                    goQr();
                }}
            >
                <p />
                <div>QR 코드</div>
                <div style="font-size: 0.7rem; color:darkgray;line-height: 0.9rem">QR코드로 단골병원을 등록하세요.</div>
            </button>
        </div>
        <br />
        <br />

        <div class="selectDgns">
            <div>
                <div class="tab_wrap">
                    <button
                        type="button"
                        class={dgnsClick == "item" ? "on" : ""}
                        on:click={() => {
                            dgnsClick = "item";
                        }}>진료항목</button
                    >
                    <button
                        type="button"
                        class={dgnsClick == "subject" ? "on" : ""}
                        on:click={() => {
                            dgnsClick = "subject";
                        }}>진료과</button
                    >
                </div>
                <section class="contents" style="padding: 24px 0 24px 0;">
                    {#if dgnsClick == "subject"}
                        <div class="btn_list">
                            <!-- 등록된 이미지 불러오기(이미지 사이즈 80*80) -->
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "D";
                                    $searchData = "가정의학과";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img
                                        src={new URL("/src/assets/img/icon_dep_04.png", import.meta.url).href}
                                        class="img"
                                        alt="."
                                    />가정의학과
                                </div>
                            </button>

                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "D";
                                    $searchData = "외과";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img
                                        src={new URL("/src/assets/img/icon_dep_09.png", import.meta.url).href}
                                        class="img"
                                        alt="."
                                    />외과
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "D";
                                    $searchData = "산부인과";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img
                                        src={new URL("/src/assets/img/icon_dep_15.png", import.meta.url).href}
                                        class="img"
                                        alt="."
                                    />산부인과
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "D";
                                    $searchData = "이비인후과";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img
                                        src={new URL("/src/assets/img/icon_dep_17.png", import.meta.url).href}
                                        class="img"
                                        alt="."
                                    />이비인후과
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "D";
                                    $searchData = "피부과";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img
                                        src={new URL("/src/assets/img/icon_dep_18.png", import.meta.url).href}
                                        class="img"
                                        alt="."
                                    />피부과
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "D";
                                    $searchData = "내과";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img
                                        src={new URL("/src/assets/img/icon_dep_19.png", import.meta.url).href}
                                        class="img"
                                        alt="."
                                    />내과
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "D";
                                    $searchData = "소아청소년과";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img
                                        src={new URL("/src/assets/img/icon_dep_20.png", import.meta.url).href}
                                        class="img"
                                        alt="."
                                    />소아청소년과
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    goto(urlList.uaHsptSrchKw);
                                }}
                                class="box_btn"
                                style="display: inline-block;
                  text-align: center;
                line-height: 1.4;"
                            >
                                <div>더보기</div>
                            </button>
                        </div>
                    {/if}
                    {#if dgnsClick == "item"}
                        <div class="btn_list">
                            <!-- 등록된 이미지 불러오기(이미지 사이즈 80*80) -->

                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "I";
                                    $searchData = "감기";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img src="/lib/img/icon_care_02.png" class="img" alt="." />감기
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "I";
                                    $searchData = "고열";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img src="/lib/img/icon_care_03.png" class="img" alt="." />고열
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "I";
                                    $searchData = "피부질환";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img src="/lib/img/icon_care_04.png" class="img" alt="." />피부질환
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "I";
                                    $searchData = "고혈압";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img src="/lib/img/icon_care_05.png" class="img" alt="." />고혈압
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "I";
                                    $searchData = "당뇨";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img src="/lib/img/icon_care_06.png" class="img" alt="." />당뇨
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "I";
                                    $searchData = "장염";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img src="/lib/img/icon_care_07.png" class="img" alt="." />장염
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    $searchWhat = "I";
                                    $searchData = "복통";
                                    goto(urlList.searchHsptView);
                                }}
                                class="box_btn"
                            >
                                <div>
                                    <img src="/lib/img/icon_care_08.png" class="img" alt="." />복통
                                </div>
                            </button>
                            <button
                                type="button"
                                on:click={() => {
                                    goto(urlList.uaHsptSrchKw);
                                }}
                                class="box_btn"
                                style="display: inline-block;
                text-align: center;
              line-height: 1.4;"
                            >
                                <div>더보기</div>
                            </button>
                        </div>
                    {/if}
                </section>
            </div>
        </div>
    </div>
    <br />
    <br />
    <br />
    <br />
</main>

{#if popUpWhat == "reg"}
    <ResvPopUp
        {hsptType}
        bind:resvPopUp
        bind:setDgnsType
        bind:timeData
        bind:ctls
        on:dgnsEvent={dgnsEvent}
        on:rsvEvent={rsvEvent}
        shpId={dgnsShpId}
    />
{/if}
