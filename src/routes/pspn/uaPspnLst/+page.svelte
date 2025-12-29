<script>
    // @ts-nocheck

    import { onDestroy, onMount } from "svelte";
    import PopUp from "$lib/sub/nav/PopUp.svelte";
    import Nav from "$lib/sub/nav/Nav.svelte";
    import { goto } from "$app/navigation";
    import { urlList } from "$lib/urlList";
    import { getAPI } from "$lib/js/getAPI";
    import { makeStr } from "$lib/js/makeStr";
    import { postAPI } from "$lib/js/postAPI";
    import { footCheck } from "$lib/store/navStore.js";
    import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
    import { drcpPspnId } from "$lib/store/pspnStore.js";
    import { getUserId } from "$lib/js/getUserId";
    import { isLogin } from "$lib/store/loginStore";
    import { updateRefresh } from "$lib/js/updateRefresh";
    import { EventSourcePolyfill, NativeEventSource } from "event-source-polyfill";
    let pspnLst = [];
    let noMore = false;
    let page = 0;
    let containerRef;
    let mbrId;
    // Intersection Observer 설정
    let sentinel;
    let observer;
    let eventSource;
    let jwt;
    onMount(async () => {
        $footCheck = "menu2";
        jwt = localStorage.getItem("userJwt");
        const refresh = localStorage.getItem("refreshJwt");
        try {
            //사용자 id를 가져온다.
            await getUserId(jwt).then(async (result) => {
                //id를 가져온 후의 로직을 작성.
                if (result != "" && result != undefined && result != "") {
                    mbrId = result;
                    search();
                    // gateway 변경전까지 주석처리
                    // stream();
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

    // gateway 변경전까지 주석처리
    // onDestroy(() => {
    //   // SSE 연결 종료 및 서버에 연결 해제 요청
    //   if (eventSource) {
    //     eventSource.close();
    //     const url = mobileUrlAddr + "/v1/sse/disconnectStream?page=pspn";
    //     let resData = postAPI(url, "");
    //     console.log("destroy:");
    //   }
    // });

    //스크롤 가능하게
    // function handleScroll() {
    //   const { scrollTop, scrollHeight, clientHeight } = containerRef;
    //   const threshold = 100; // 스크롤 임계값

    //   if (scrollHeight - scrollTop - clientHeight < threshold) {
    //     if (!noMore) {
    //       loadMoreData();
    //     }
    //   }
    // }

    //검색
    async function search() {
        noMore = true;
        const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/pspn/uaPspnLst?page=" + page;
        let resData = await getAPI(url);
        pspnLst = resData.resultVO;
        console.log(pspnLst);
        noMore = false;
    }

    //페이징처리 데이터 불러오도록
    async function loadMoreData() {
        page += 1;
        const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/pspn/uaPspnLst?page=" + page;
        let resData = await getAPI(url);
        let newData = resData.resultVO;
        if (newData.length == 0) {
            noMore = true;
        }
        console.log(newData);
        pspnLst = [...pspnLst, ...newData];
    }

    //sse 연결
    async function stream() {
        console.log("connect: ");

        const url = mobileUrlAddr + "/v1/sse/connectStream?page=pspn";
        const EventSource = EventSourcePolyfill || NativeEventSource;
        eventSource = new EventSource(url, {
            headers: {
                "Content-Type": "text/event-stream",
                "bizportal-access-token": jwt,
            },
            heartbeatTimeout: 3000000,
        });
        eventSource.onopen = function () {
            console.log(new Date() + "SSE connection established");
        };
        eventSource.onerror = function (event) {
            console.log(new Date() + "SSE connection error:", event);
        };
        eventSource.onmessage = function (event) {
            console.log(new Date() + "Received message:", event);
        };
        eventSource.addEventListener("updatePspn", function (event) {
            console.log(new Date() + "Received update event:", event);
            var updateData = JSON.parse(event.data);
        });
        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }
</script>

<Nav>처방 목록</Nav>
<section class="contents">
    <div class="list_box" id="pre_list">
        {#each pspnLst as pspn}
            <!-- 처방전 정보 S -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                class="box_1"
                on:click={() => goto(urlList.uaPspnDtl + "?pspnId=" + pspn.pspnId + "&drcpId=" + pspn.drcpId)}
            >
                <div class="pspnLst">
                    <p class="name">
                        {pspn.hsptName}{#if pspn.drstName != null}&nbsp;|&nbsp; {pspn.drstName}{/if}
                    </p>
                    <br />
                    <p class="data">의사처방&nbsp;{pspn.rsvDttm}</p>
                    {#if pspn.finDttm != null}
                        <p class="data">약국접수&nbsp;{pspn.finDttm}</p>
                    {/if}
                    {#if pspn.dlvDttm != null}
                        <p class="data">약품배송&nbsp;{pspn.dlvDttm}</p>
                    {/if}
                    <div class="ar box3">
                        {#if pspn.pspnFaxRcpt == null}
                            <span
                                class="mbtn_b"
                                on:click|stopPropagation={() => {
                                    if (pspn.pspnUrl == "Y") {
                                        $drcpPspnId = pspn.pspnId;
                                        goto(urlList.uaPspnMap);
                                    }
                                }}>미전송</span
                            >
                            <!-- {:else if pspn.drcpStat == "결제전"}
              <span
                class="mbtn_g"
                on:click|stopPropagation={() => {
                  goto(urlList.uaPspnPay + "?drcpId=" + pspn.drcpId);
                }}>{pspn.drcpStat}</span
              > -->
                        {:else}
                            <span class="mbtn_b">전송</span>
                        {/if}
                        <!-- {#if pspn.dlvType === "택배" && pspn.dlvDttm != null}
              <button type="button" class="mbtn_b">택배배송</button>
            {/if} -->
                    </div>
                </div>
            </div>
            <!-- 처방전 정보 E -->
        {/each}
    </div>
    <div bind:this={sentinel} />
</section>
