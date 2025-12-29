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
    import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
    import { meeting_key } from "$lib/js/Env";
    import { getUserId } from "$lib/js/getUserId";
    import { isLogin } from "$lib/store/loginStore";
    import { updateRefresh } from "$lib/js/updateRefresh";
    import { getFetch } from "$lib/js/getFetch";
    let dgnsWt = [];
    let dgnsId;
    let mbrId;
    let photoUrl = "";
    let dgnsRsvDttm;
    let leftTime = "";
    let conf = "";
    let timeoutId = null;
    let popUp = false;
    onMount(async () => {
        const jwt = localStorage.getItem("userJwt");
        const refresh = localStorage.getItem("refreshJwt");
        try {
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
                    console.log(dgnsWt);
                    getPhoto();
                    // updateRemainingTime();
                    // scheduleNextUpdate();
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
    function updateRemainingTime() {
        dgnsRsvDttm = new Date(dgnsWt.dgnsRsvDttm);
        let now = new Date();
        let timeDiff = dgnsRsvDttm - now;
        let minutes = Math.floor(timeDiff / (1000 * 60)) % 60;
        let hours = Math.floor(timeDiff / (1000 * 60 * 60));
        leftTime = hours + "시간 " + minutes + "분 남음";
    }
    async function getPhoto() {
        if (dgnsWt.dgnsDtrPath != null) {
            const url = shopUrlAddr + "/v1/shop/storage/getDtrImage?dtrId=" + dgnsWt.dgnsDtrId;
            let resData = await getFetch(url, localStorage.getItem("userJwt"));
            let blob = await resData.blob();
            console.log(blob);
            photoUrl = URL.createObjectURL(blob);
        }
    }
    function scheduleNextUpdate() {
        timeoutId = setTimeout(() => {
            updateRemainingTime();
            scheduleNextUpdate();
        }, 1000);
    }
    async function getConfUrl() {
        //이부분부터 시연을 위한 부분 시작 1. 시연 후 삭제
        if (mbrId == "179") {
            joinMobileRoom();
        } else {
            //시연을 위한 부분 끝 1
            const confUrl = /*urlAddr + "8083*/ authUrlAddr + "/v1/chat/getJoinUrl?dgnsId=" + dgnsWt.dgnsId;
            let resData = await getAPI(confUrl);
            conf = resData.resultVO;
            console.log(conf);
            if (conf == null) {
                popUp = true;
            } else {
                if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    console.log("dgns");
                    window.webkit.messageHandlers.requestSafari.postMessage(conf);
                } else if (typeof Android !== "undefined") {
                    Android.getCameraMicPermission();
                    window.receiveCamMicPermission = (permission) => {
                        if (permission == true) {
                            goto(conf);
                        }
                    };
                } else {
                    goto(conf);
                }
            }
            //이부분부터 시연을 위한 부분 시작 2. 시연 후 삭제
        }
        //시연을 위한 부분 끝 2
    }

    //이부분부터 시연을 위한 부분 시작3. 시연 후 삭제
    async function joinMobileRoom() {
        const reqUid = 23;
        const reqHkey = "0efc94e69558a9e43181a602aa7cfcafa611e063a0505530ed4b0a508801336c";
        const atenId = 444;
        const userType = "p";
        const displayName = "Kim";
        const msbsvr = "https://peru.dhdx.kr/msb";
        const rtnUrl = "https://test.barodoctor.com/home/uaHome";

        const reqRoomUserUrl = msbsvr + "/api/getRoomUserInfo";
        const reqRoomUserData = {
            reqUid: reqUid,
            reqHkey: reqHkey,
            atenId: atenId,
            utype: userType,
        };
        const resRoomUserData = await postFetch(reqRoomUserUrl, reqRoomUserData);

        const reqJoinRoomData = {
            reqUid: reqUid,
            reqHkey: reqHkey,
            hdid: resRoomUserData.hdid,
            utype: resRoomUserData.utype,
            vromId: resRoomUserData.vromId,
            usrId: resRoomUserData.usrId,
            ausrId: resRoomUserData.ausrId,
            limtDttm: resRoomUserData.limtDttm,
            token: resRoomUserData.token,
            atenId: resRoomUserData.atenId,
            pin: resRoomUserData.pin,
            displayName: displayName,
            rtnUrl: rtnUrl,
        };
        const reqJoinUrl = msbsvr + "/api/join-mobileroom";
        openPostWindow(reqJoinUrl, reqJoinRoomData);
    }

    function openPostWindow(url, data) {
        // 동적으로 폼을 생성
        var form = document.createElement("form");
        // data 객체의 각 키-값 쌍을 input 태그로 변환해 폼에 추가
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = data[key];
                form.appendChild(input);
            }
        }

        form.action = url;
        form.method = "POST";
        // form.target = "newWindow";

        // 폼을 문서에 추가한 후 전송
        document.body.appendChild(form);
        form.submit();

        // 폼을 전송 후 삭제
        document.body.removeChild(form);
    }

    async function postFetch(url, jsonData) {
        return await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(jsonData),
        })
            .then((response) => {
                // 응답이 성공인지 확인
                if (!response.ok) {
                    return Promise.reject(new Error(`HTTP error! Status: ${response.status}`));
                }
                return response.json();
            })
            .then((data) => {
                // 비즈니스 로직에 따라 resultCode를 확인
                if (data.resultCode !== 0) {
                    return Promise.reject(new Error(`ResultCode error! Data: ${data}`));
                } else {
                    const resultData = data.resultObj;
                    return resultData;
                }
            })
            .catch((error) => {
                console.log(error);
                return Promise.reject(error);
            });
    }

    //시연을 위한 부분 끝 3

    onDestroy(() => {
        clearTimeout(timeoutId);
    });
    function xButton() {
        popUp = false;
    }
    // async function makeRoom() {
    //   const roomUrl = "/auth/v1/rsupporter/makeRoom?dgnsId=" + dgnsId;
    //   let resData = await getAPI(roomUrl);
    //   console.log(resData);
    //   let room = resData.resultVO;
    //   goto(room);
    // }
    // async function joinRoom() {
    //   const roomUrl = "/auth/v1/rsupporter/getJoinUrl?dgnsId=" + dgnsId;
    //   let resData = await getAPI(roomUrl);
    //   let room = resData.resultVO.joinUrl;
    //   goto(room);
    // }

    function getImg(imgUrl) {
        return "data:image/jpeg;base64," + imgUrl;
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
                <!-- <div class="stime">
          <p class="title">예약</p>
          <p>{leftTime}</p>
        </div> -->
            </div>
        </div>
        <div id="tel_control">
            <!-- 유프리즘 API -->
            <!-- 
      <button
        type="button"
        class="mbtn_r_1 btn_01"
        on:click={() => {
          makeConf();
        }}>진료실 입장(의사)</button
      > -->

            <button
                type="button"
                class="mbtn_s_1 btn_01"
                on:click={() => {
                    getConfUrl();
                }}>본인확인 하러가기</button
            >

            <!-- zoom video sdk -->
            <!-- <button
        type="button"
        class="mbtn_r_1 btn_01"
        on:click={() => {
          goto(urlList.uaVdodgnsChk + "?dgnsId=" + dgnsId);
        }}>진료실 입장(줌비디오)</button
      > -->
            <!-- zoom meeting sdk -->
            <!-- <button
        type="button"
        class="mbtn_r_1 btn_01"
        on:click={() => {
          // goto(urlList.meetingSdk + "?dgnsId=" + dgnsId);
          goto(urlList.meetingSdk + "?dgnsId=" + dgnsId + "&mn=");
        }}>진료실 입장(줌미팅-환자)</button
      >
      <button
        type="button"
        class="mbtn_r_1 btn_01"
        on:click={() => {
          // goto(urlList.meetingSdk + "?dgnsId=" + dgnsId);
          goto(
            "https://zoom.us/oauth/authorize?response_type=code&client_id=" +
              meeting_key +
              "&redirect_uri=https://localhost:5173/vdodgns/meetingDtr?dgnsId=" +
              dgnsId
          );
        }}>진료실 입장(줌미팅-의사)</button
      > -->
            <!--알서포트-->
            <!-- <button
        type="button"
        class="mbtn_r_1 btn_01"
        on:click={() => {
          makeRoom();
        }}>진료실 입장(회의 만들기)</button
      >
      <button
        type="button"
        class="mbtn_r_1 btn_01"
        on:click={() => {
          joinRoom();
        }}>진료실 입장(시작된 회의)</button
      > -->
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
