<script>
    // @ts-nocheck

    import { onMount } from "svelte";
    import PopUp from "$lib/sub/nav/PopUp.svelte";
    import Nav from "$lib/sub/nav/Nav.svelte";
    import Daum from "svelte-daum-postcode";
    import { getAPI } from "$lib/js/getAPI";
    import { postAPI } from "$lib/js/postAPI";
    import { goto } from "$app/navigation";
    import { urlList } from "$lib/urlList";
    import { apiServerAddr, authUrlAddr } from "$lib//js/urlAddr";
    import { isLogin } from "$lib/store/loginStore";
    import { updateRefresh } from "$lib/js/updateRefresh";
    import { getUserId } from "$lib/js/getUserId";
    import { makeStr } from "$lib/js/makeStr";

    /**
     * 로그인할 때 만들어진 jwt를 저장하는 함수
     */
    let userJwt = "";
    let refresh = "";
    let logintool = "";

    let id = "";
    let name = "";
    let specific = "";
    let medicine = "";

    let addToggle = false;
    let popUp = false;
    let selectPopUp = "";

    /**
     * 페이지 로딩시에 현재 로그인 되어있는 고객의 정보를 가져온다.
     */
    onMount(async () => {
        userJwt = localStorage.getItem("userJwt");
        refresh = localStorage.getItem("refreshJwt");
        logintool = localStorage.getItem("logintool");

        try {
            const url = authUrlAddr + "/v1/member/selectMemberInfo";
            let result = await getAPI(url, userJwt);

            id = result.mbrId;
            name = result.mbrName;
            specific = result.mbrSpecific;
            medicine = result.mbrTakeMedicine;
        } catch (err) {
            console.log(err);

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
                goto(urlList.uaLogin);
            }
        }
    });

    /**
     * 회원 정보를 업데이트하는 함수
     */
    async function updateData() {
        const url = authUrlAddr + "/v1/member/updateMemberSpecific";

        const memberData = {
            mbrSpecific: specific,
            mbrTakeMedicine: medicine,
        };

        const result = await postAPI(url, JSON.stringify(memberData), userJwt);
        console.log(result);
        if (result == 1) {
            //수정 완료됐다는 창 띄우고 메뉴화면으로 이동
            selectPopUp = "success";
            popUp = true;
        } else {
            //수정 실패했다는 창 띄움
            selectPopUp = "fail";
            popUp = true;
        }
    }

    /**
     * 주소검색 창을 여닫는 함수
     */
    function toggleButton() {
        addToggle = !addToggle;
    }

    /**
     * 주소검색 창에서 주소를 선택 한 후에 선택한 데이터를 input에 추가하는 함수
     * @param detail 선택한 주소의 자세한 정보가 들어가 있는 json
     */
    function addComplete({ detail: { data } }) {
        addNum = data.zonecode;
        add = data.address;
        addToggle = false;
    }

    /**
     * 탈퇴가 확실한지 확인창을 여는 함수
     */
    function quitCheck() {
        selectPopUp = "quitCheck";
        popUp = true;
    }

    /**
     * 탈퇴를 진행하는 함수
     */
    async function quitFunction() {
        popUp = false;
        if (logintool == "kakao") {
            const url = authUrlAddr + "/kakao/quitKakaoMember";
            try {
                await postAPI(url, id).then((result) => {
                    if (result > 0) {
                        localStorage.setItem("userJwt", "");
                        localStorage.setItem("refreshJwt", "");
                        localStorage.setItem("logintool", "");
                        selectPopUp = "quit";
                        popUp = true;
                    } else {
                        throw new Error("회원탈퇴에 실패했습니다.");
                    }
                });
            } catch (err) {
                console.error(err);
                selectPopUp = "fail";
                popUp = true;
            }
        } else if (logintool == "google") {
            const url = authUrlAddr + "/kakao/quitGoogleMember";
            try {
                await postAPI(url, id).then((result) => {
                    if (result > 0) {
                        localStorage.setItem("userJwt", "");
                        localStorage.setItem("refreshJwt", "");
                        localStorage.setItem("logintool", "");
                        selectPopUp = "googlequit";
                        popUp = true;
                    } else {
                        throw new Error("회원탈퇴에 실패했습니다.");
                    }
                });
            } catch (err) {
                console.error(err);
                selectPopUp = "fail";
                popUp = true;
            }
        }
    }
</script>

<svelte:head></svelte:head>

<Nav>회원 특이사항</Nav>
<section class="profilePage">
    <div class="profileCard">
        <label class="field">
            <span class="field__label">특이사항</span>
            <textarea
                class="field__textarea"
                bind:value={specific}
                on:input={(e) => {
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height =
                        e.currentTarget.scrollHeight + "px";
                }}
                placeholder="알레르기, 기저질환(고혈압/당뇨), 수술력, 주의사항 등을 입력해주세요."
                rows="4"
            />
            <span class="field__hint">최대 300자</span>
        </label>

        <label class="field">
            <span class="field__label" style="padding-top: 20px"
                >복용중인 약</span
            >
            <textarea
                class="field__textarea"
                bind:value={medicine}
                on:input={(e) => {
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height =
                        e.currentTarget.scrollHeight + "px";
                }}
                placeholder="복용중인 약 정보를 입력해주세요."
                rows="4"
            />
            <span class="field__hint">최대 300자</span>
        </label>

        <!-- 저장 버튼 -->
        <div class="actions">
            <button class="primaryBtn" type="button" on:click={updateData}
                >특이사항 수정</button
            >
        </div>
    </div>
</section>

{#if selectPopUp == "success"}
    <PopUp {popUp}>
        <slot>
            <h2>회원정보가 수정되었습니다.</h2>
        </slot>
        <div slot="btns" class="btn_wrap">
            <button
                type="button"
                class="btn_04"
                name="chbtn"
                id="visit"
                on:click={() => {
                    popUp = false;
                    history.back();
                }}
            >
                확인
            </button>
        </div>
    </PopUp>
{:else if selectPopUp == "error"}
    <PopUp {popUp}>
        <slot>
            <h2>입력한 정보를 확인해주세요.</h2>
        </slot>
        <div slot="btns" class="btn_wrap">
            <button
                type="button"
                class="btn_04"
                name="chbtn"
                id="visit"
                on:click={() => {
                    popUp = false;
                }}
            >
                확인
            </button>
        </div>
    </PopUp>
{:else if selectPopUp == "fail"}
    <PopUp {popUp}>
        <slot>
            <h2>오류가 발생했습니다. 다시 시도해주세요.</h2>
            <button
                type="button"
                class="alert_close"
                on:click={() => {
                    popUp = false;
                }}
            >
                <i class="xi-close-min" />
            </button>
        </slot>
        <div slot="btns" class="btn_wrap">
            <button
                type="button"
                class="btn_04"
                name="chbtn"
                id="visit"
                on:click={() => {
                    popUp = false;
                }}
            >
                확인
            </button>
        </div>
    </PopUp>
{/if}

<style>
    :root {
        --bottom-nav-h: 80px; /* 네 탭바 높이에 맞춰 조절 (90~110 사이) */
    }

    /* profilePage는 padding-bottom 너무 크게 줄 필요 없음 */
    .profilePage {
        padding: 18px 14px 20px;
        background: #f6f7fb;
        min-height: 100dvh;
    }

    /* ✅ 스크롤 끝을 밀어주는 진짜 해결책 */
    .bottomSpacer {
        height: calc(var(--bottom-nav-h) + 24px + env(safe-area-inset-bottom));
    }

    .profileCard {
        max-width: 560px;
        margin: 0 auto;
        background: #fff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        padding: 18px 16px 16px;
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
    }

    .field {
        display: block;
        margin: 16px 0;
    }

    .field__label {
        display: block;
        font-size: 16px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.62);
        letter-spacing: -0.2px;
    }

    .field__textarea {
        width: 100%;
        min-height: 160px; /* ✅ 기본 적절 크기 */
        max-height: 240px; /* 너무 커지지 않게 */
        resize: vertical; /* 사용자가 늘릴 수 있게(원하면 none) */

        border-radius: 12px;
        border: 1px solid rgba(0, 0, 0, 0.14);
        background: #fff;

        padding: 12px 14px;
        font-size: 16px;
        line-height: 1.45;
        outline: none;
        box-sizing: border-box;

        transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
    }

    .field__textarea:focus {
        border-color: rgba(16, 166, 213, 0.95);
        box-shadow: 0 0 0 4px rgba(16, 166, 213, 0.18);
    }

    .field__hint {
        display: block;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.55);
    }

    /* Actions */
    .actions {
        margin: 40px 0 16px 0;
        display: flex;
        gap: 10px;
    }

    .primaryBtn {
        width: 100%;
        height: 48px;
        border: 0;
        border-radius: 12px;
        background: #10a6d5;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 4px rgba(16, 166, 213, 0.24);
        transition:
            transform 0.12s ease,
            filter 0.12s ease;
    }

    .primaryBtn:hover {
        filter: brightness(0.98);
    }

    .primaryBtn:active {
        transform: scale(0.99);
    }

    /* Responsive */
    @media (max-width: 420px) {
        .profilePage {
            padding: 16px 12px 24px;
        }

        .profileCard {
            padding: 16px 12px 14px;
        }

        .field__textarea {
            min-height: 110px;
            font-size: 15px;
        }
    }
</style>
