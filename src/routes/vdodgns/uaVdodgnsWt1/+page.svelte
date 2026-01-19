<script>
    // @ts-nocheck

    import { onMount, onDestroy } from "svelte";
    import PopUp from "$lib/sub/nav/PopUp.svelte";
    import Nav from "$lib/sub/nav/Nav.svelte";
    import { goto } from "$app/navigation";
    import { getAPI } from "$lib/js/getAPI";
    import { page } from "$app/stores";
    import { footCheck } from "$lib/store/navStore.js";
    import { shopUrlAddr, authUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
    import { getUserId } from "$lib/js/getUserId";
    import { isLogin } from "$lib/store/loginStore";
    import { updateRefresh } from "$lib/js/updateRefresh";
    import { getFetch } from "$lib/js/getFetch";
    let dgnsWt = [];
    let dgnsId;
    let mbrId;
    let photoUrl = "";
    let conf = "";
    let timeoutId = null;
    let popUp = false;
    let dgnsInfo = [];
    let bodaReady = false;

    // Boda 기본 설정 (필요한 항목만 덮어쓰기)
    function initBoda() {
        if (typeof window === "undefined" || !window.BodaApi) {
            console.warn("BodaApi 스크립트가 아직 준비되지 않았습니다.");
            return;
        }

        //직접 값 오버라이드
        window.BodaApi.defaultSettings();
        console.log("BodaApi 초기화 완료");
        bodaReady = true;
    }

    onMount(async () => {
        const jwt = localStorage.getItem("userJwt");
        const refresh = localStorage.getItem("refreshJwt");
        try {
            initBoda();

            //사용자 id를 가져온다.
            await getUserId(jwt).then(async (result) => {
                //id를 가져온 후의 로직을 작성.
                if (result != "" && result != undefined && result != "") {
                    mbrId = result;
                    $isLogin = true;
                    $footCheck = "";
                    dgnsId = $page.url.searchParams.get("dgnsId");
                    const url = /*urlAddr + "8082*/ mobileUrlAddr + "/v1/dgns/selectDgnsWtInfo?dgnsId=" + dgnsId;
                    let resData = await getAPI(url);
                    dgnsWt = resData.resultVO;
                    getPhoto();
                }
                await getDgnsInfo(dgnsId);
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

    async function getPhoto() {
        if (dgnsWt.dgnsDtrPath != null) {
            const url = shopUrlAddr + "/v1/shop/storage/getDtrImage?dtrId=" + dgnsWt.dgnsDtrId;
            let resData = await getFetch(url, localStorage.getItem("userJwt"));
            let blob = await resData.blob();
            console.log(blob);
            photoUrl = URL.createObjectURL(blob);
        }
    }

    onDestroy(() => {
        clearTimeout(timeoutId);
    });
    function xButton() {
        popUp = false;
    }

    async function getDgnsInfo(dgnsId) {
        const url = mobileUrlAddr + "/v1/dgns/selectDgnsDtl?dgnsId=" + dgnsId;
        let resData = await getAPI(url);
        dgnsInfo = resData.resultVO;
        console.log("getDgnsInfo : ", dgnsInfo);
    }

    function makeConf() {
        // // 1. BodaApi 준비 체크
        // if (!bodaReady || typeof window === "undefined" || !window.BodaApi) {
        //     alert("영상 시스템 준비 중입니다. 잠시 후 다시 시도해 주세요.");
        //     return;
        // }

        const userId = dgnsId;
        const userName = dgnsInfo.dgnsPatName;
        const roomCode = dgnsInfo.dgnsRoomCode;

        console.log("dgnsInfo.dgnsRoomCode : ", dgnsInfo.dgnsRoomCode);

        window.BodaApi.join(
            {
                roomCode,
                joinUserType: 1,
                userId,
                userName,
                webRtc: true,
                platformType: "WINDOWS",
            },
            () => {
                console.log("Boda join 성공");
            },
            (errCode, detail) => {
                console.error("Boda join 실패", errCode, detail);
                alert("영상 접속 중 오류가 발생했습니다. 다시 시도해 주세요.");
            }
        );
    }
</script>

<Nav>진료대기실</Nav>
<section id="tel_wrap">
    <div id="tel">
        <div class="top">
            <h3>{dgnsWt.dgnsShpName}</h3>
            <p>담당 간호사</p>
        </div>
        <div class="Screen">
            <div>
                <!-- svelte-ignore a11y-missing-attribute -->
                <div class="big">
                    {#if photoUrl != null && photoUrl != ""}
                        <img src={photoUrl} class="img" style="width:100%; height:100%; object-fit: contain;" />
                    {:else}
                        <img
                            src={new URL("$lib/img/sample_doc.png", import.meta.url).href}
                            class="img"
                            style="width:100%; height:100%; object-fit: contain;"
                        />
                    {/if}
                </div>
            </div>
        </div>
        <div id="tel_control">
            <button
                type="button"
                class="mbtn_s_1 btn_01"
                on:click={() => {
                    makeConf();
                }}>본인확인 하러가기</button
            >
        </div>
    </div>
</section>
<PopUp {popUp}>
    <slot>
        진료실이 개설되지 않았습니다. <button type="button" class="alert_close" on:click={xButton}>
            <i class="xi-close-min" />
        </button>
    </slot>
    <p class="btn_wrap" id="btn" slot="btns">
        <button type="button" class="mbtn_n_4" id="close" on:click={xButton}>확인</button>
    </p>
    <p />
</PopUp>
