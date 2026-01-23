<script>
    import Nav from "$lib/sub/nav/Nav.svelte";
    import { goto } from "$app/navigation";
    import { urlList } from "$lib/urlList";
    import { apiServerAddr } from "$lib/js/urlAddr";
    import { getAPI } from "$lib/js/getAPI";
    import { isLogin } from "$lib/store/loginStore";
    import { updateRefresh } from "$lib/js/updateRefresh";
    import { onMount, tick } from "svelte";
    import { redirect } from "@sveltejs/kit";

    import SignaturePad from "signature_pad";
    import html2canvas from "html2canvas";

    let jwt = "";
    let refresh = "";

    function gotoPage(url) {
        goto(url);
    }

    // ===== 전자문서 입력값 (PDF 항목 그대로) =====
    let mbrName = "";
    let mbrPhone = "";
    let mbrBirthdate = "";
    let mbrAddress = "";

    let agentName = "";
    let agentPhone = "";
    let agentBirthdate = "";
    let agentRelation = "방문간호사";

    let consent = ""; // "동의" | "비동의"
    let docDate = ""; // "20  년  월  일" 형태/또는 "2025년 12월 28일"

    // ===== 서명 이미지 (dataURL) =====
    let signatures = { mbr: null, agent: null };

    // ===== 서명 모달 =====
    let isSignModalOpen = false;
    let currentTarget = null; // "mbr" | "agent"
    let canvasEl = null;
    let sigPad = null;

    // ===== 캡처 대상(전자문서 전체) =====
    let captureRootEl = null;

    function formatKoreanDate(d = new Date()) {
        // 한국시간 기준으로 날짜 문자열 생성
        const kst = new Date(
            d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
        );
        const y = kst.getFullYear();
        const m = String(kst.getMonth() + 1).padStart(2, "0");
        const day = String(kst.getDate()).padStart(2, "0");
        return `${y}.${m}.${day}`;
    }

    onMount(async () => {
        docDate = formatKoreanDate();
        jwt = localStorage.getItem("userJwt");
        refresh = localStorage.getItem("refreshJwt");

        try {
            const url = apiServerAddr + "/v1/member/selectMemberInfo";
            let result = await getAPI(url, jwt);
            console.log(result);

            mbrName = result.mbrName;
            mbrPhone = result.mbrTel;
            mbrBirthdate = result.mdtlBrth;
            mbrAddress = `${result.mbrAddr} ${result.mbrAddrDtl}`;
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

    function lockBodyScroll(lock) {
        document.body.style.overflow = lock ? "hidden" : "";
        document.body.style.touchAction = lock ? "none" : "";
    }

    async function openSignModal(target) {
        currentTarget = target;
        isSignModalOpen = true;
        lockBodyScroll(true);

        await tick();
        await new Promise((r) => requestAnimationFrame(r));

        if (!canvasEl) return;

        sigPad = new SignaturePad(canvasEl, {
            minWidth: 2,
            maxWidth: 4,
            penColor: "#111827",
        });

        resizeSignatureCanvasAndRestore();
    }

    function resizeSignatureCanvasAndRestore() {
        if (!canvasEl || !sigPad) return;

        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvasEl.getBoundingClientRect();

        canvasEl.width = Math.floor(rect.width * ratio);
        canvasEl.height = Math.floor(rect.height * ratio);

        const ctx = canvasEl.getContext("2d");
        if (ctx) ctx.scale(ratio, ratio);

        sigPad.clear();

        if (currentTarget && signatures[currentTarget]) {
            sigPad.fromDataURL(signatures[currentTarget], { ratio: 1 });
        }
    }

    function closeSignModal() {
        isSignModalOpen = false;
        currentTarget = null;
        sigPad = null;
        lockBodyScroll(false);
    }

    function clearSignature() {
        sigPad && sigPad.clear();
    }

    function applySignature() {
        if (!sigPad || !currentTarget) return;
        if (sigPad.isEmpty()) {
            alert("서명을 해주세요.");
            return;
        }
        signatures[currentTarget] = sigPad.toDataURL("image/png");
        closeSignModal();
    }

    function resetAll() {
        if (!confirm("입력/서명을 모두 초기화할까요?")) return;

        mbrAddress = "";

        agentName = "";
        agentPhone = "";
        agentBirthdate = "";
        agentRelation = "방문간호사";

        consent = "";

        signatures = { mbr: null, agent: null };
    }

    function validateBeforeSave() {
        if (!consent) return "동의/비동의를 선택해주세요.";
        if (!mbrName.trim()) return "위임인(환자) 성명을 입력해주세요.";
        if (!agentName.trim()) return "수임인(대리수령자) 성명을 입력해주세요.";
        if (!docDate.trim()) return "작성일을 입력해주세요.";
        if (!signatures.mbr) return "환자(위임인) 서명이 필요합니다.";
        if (!signatures.agent) return "대리인(수임인) 서명이 필요합니다.";
        return null;
    }

    async function saveAsSingleImage() {
        const err = validateBeforeSave();
        if (err) return alert(err);

        if (!captureRootEl) return;

        const prevScrollY = window.scrollY;
        window.scrollTo(0, 0);

        const tempReplacements = [];

        // [A] Select 박스 치환 (기존 해결 방식 유지)
        const selectEl = captureRootEl.querySelector("select");
        if (selectEl) {
            const selectWrap = selectEl.parentElement;
            const tempText = document.createElement("div");
            tempText.innerText = agentRelation;
            tempText.style.cssText =
                "padding: 6px 8px; font-size: 16px; color: #111;";
            selectEl.style.display = "none";
            const arrow = selectWrap.querySelector(".select-arrow");
            if (arrow) arrow.style.display = "none";
            selectWrap.appendChild(tempText);
            tempReplacements.push(() => {
                selectEl.style.display = "";
                if (arrow) arrow.style.display = "";
                tempText.remove();
            });
        }

        // [B] 동의/비동의 체크박스를 사진 속 모양(두꺼운 사각형 + 정밀 정중앙 체크)으로 치환
        const checkLabels = captureRootEl.querySelectorAll(".xe-check");
        checkLabels.forEach((label) => {
            const iconContainer = label.querySelector(".icon");
            const input = label.querySelector("input");

            // 원본 아이콘 일시 숨김
            if (iconContainer) iconContainer.style.display = "none";

            // 외곽 박스 생성 (사진처럼 굵고 선명하게)
            const tempBox = document.createElement("div");
            tempBox.style.cssText = `
        width: 24px;
        height: 24px;
        border: 2px solid #000;
        margin-right: 8px;
        background: #fff;
        flex-shrink: 0;
        box-sizing: border-box;
        position: relative; /* 자식(체크표시) 정렬 기준 */
        display: inline-block;
        vertical-align: middle;
    `;

            if (input.checked) {
                const checkMark = document.createElement("span");
                checkMark.innerText = "✓";

                // 폰트 고유 여백을 무시하고 박스 정중앙에 고정하는 핵심 스타일
                checkMark.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            /* translate 값을 조절하여 위치 확정: 
               -50%(가로중앙), -60%(세로중앙 보정 - 꼬리가 길어서 더 들어올림) */
            transform: translate(-50%, -60%); 
            font-size: 22px; 
            font-weight: 900; 
            color: #000; 
            line-height: 1;
            display: block;
            width: 100%;
            text-align: center;
            font-family: sans-serif; /* 폰트 일관성 유지 */
        `;
                tempBox.appendChild(checkMark);
            }

            label.prepend(tempBox);

            tempReplacements.push(() => {
                if (iconContainer) iconContainer.style.display = "";
                tempBox.remove();
            });
        });

        // 버튼 숨기기
        const hideEls = captureRootEl.querySelectorAll(
            "[data-capture-hide='true']",
        );
        hideEls.forEach((el) => (el.style.display = "none"));

        try {
            const canvas = await html2canvas(captureRootEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });

            const dataUrl = canvas.toDataURL("image/png");
            const safeName = (mbrName || "미입력").replace(
                /[\\/:*?"<>|]/g,
                "_",
            );
            const ymd = docDate.replace(/\D/g, "").slice(0, 8) || "date";
            const filename = `${ymd}_위임장_${safeName}.png`;

            const result = await uploadConsentImageToServer(dataUrl, filename, {
                mbrName,
                mbrPhone,
                mbrBirthdate,
                mbrAddress,
                agentName,
                agentPhone,
                agentBirthdate,
                agentRelation,
                consent,
                docDate,
            });

            alert("위임장 작성이 완료되었습니다.");
            goto("/mbr/consents", { replaceState: true });
        } catch (e) {
            console.error(e);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            tempReplacements.forEach((restore) => restore());
            hideEls.forEach((el) => (el.style.display = ""));
            window.scrollTo(0, prevScrollY);
        }
    }

    async function uploadConsentImageToServer(dataUrl, filename, meta) {
        const base64 = dataUrl.split(",")[1];

        const res = await fetch(`${apiServerAddr}/v1/consents`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(jwt ? { "bizportal-access-token": jwt } : {}),
            },
            // credentials: "include",
            body: JSON.stringify({
                docType: "DRUG_PROXY_RECEIPT_CONSENT",
                filename,
                imageBase64: base64,
                meta,
            }),
        });

        if (!res.ok) {
            const t = await res.text().catch(() => "");
            throw new Error(`upload failed: ${res.status} ${t}`);
        }
        return await res.json(); // { id, filePath, url ... }
    }

    async function savePngToPickedFolder(dataUrl, filename) {
        // Chrome/Edge에서만 동작 가능성이 큼
        if (!window.showDirectoryPicker) {
            // 지원 안되면 기존 다운로드로 fallback
            downloadDataUrl(dataUrl, filename);
            return;
        }

        // dataURL -> Blob
        const blob = await (await fetch(dataUrl)).blob();

        // 폴더 선택
        const dirHandle = await window.showDirectoryPicker({
            mode: "readwrite",
        });

        // 파일 생성/열기
        const fileHandle = await dirHandle.getFileHandle(filename, {
            create: true,
        });
        const writable = await fileHandle.createWritable();

        // 쓰기
        await writable.write(blob);
        await writable.close();
    }

    // 모달 열린 상태에서 회전/리사이즈 대응
    function onResize() {
        if (!isSignModalOpen) return;
        setTimeout(() => resizeSignatureCanvasAndRestore(), 0);
    }

    function formatPhone(value) {
        // 1) 숫자만 남기기
        const numbers = value.replace(/\D/g, "");

        // 2) 길이에 따라 포맷팅
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
    }

    function onPhoneInput(e) {
        agentPhone = formatPhone(e.target.value);
    }

    onMount(() => {
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    });
</script>

<Nav>약 대리수령 위임장 작성</Nav>

<section class="contents">
    <!-- 전자문서(캡처 대상) -->
    <div class="doc-wrap" bind:this={captureRootEl}>
        <!-- 문서 본문: PDF 서식처럼 박스/라인 구성 -->
        <div class="paper">
            <div class="big-title">약 대리수령 동의서 및 위임장</div>
            <div>
                <!-- 위임인 -->
                <div class="box">
                    <div class="box-title">동의 및 위임자 (위임인)</div>

                    <div class="row">
                        <div class="cell label">성명</div>
                        <div class="cell input">
                            <input
                                bind:value={mbrName}
                                placeholder=""
                                autocomplete="off"
                            />
                        </div>
                    </div>

                    <div class="row">
                        <div class="cell label">연락처</div>
                        <div class="cell input">
                            <input
                                bind:value={mbrPhone}
                                placeholder=""
                                autocomplete="off"
                                inputmode="tel"
                            />
                        </div>
                    </div>

                    <div class="row">
                        <div class="cell label">생년월일</div>
                        <div class="cell input">
                            <input
                                type="date"
                                bind:value={mbrBirthdate}
                                placeholder=""
                                autocomplete="off"
                            />
                        </div>
                    </div>

                    <div class="row">
                        <div class="cell label">주소</div>
                        <div class="cell input">
                            <input
                                bind:value={mbrAddress}
                                placeholder=""
                                autocomplete="off"
                            />
                        </div>
                    </div>
                </div>

                <!-- 수임인 -->
                <div class="box">
                    <div class="box-title">대리 수령자 (수임인)</div>

                    <div class="row">
                        <div class="cell label">성명</div>
                        <div class="cell input">
                            <input
                                bind:value={agentName}
                                placeholder=""
                                autocomplete="off"
                            />
                        </div>
                    </div>

                    <div class="row">
                        <div class="cell label">연락처</div>
                        <div class="cell input">
                            <input
                                value={agentPhone}
                                on:input={onPhoneInput}
                                placeholder="010-1234-5678"
                                autocomplete="off"
                                inputmode="tel"
                                maxlength="13"
                            />
                        </div>
                    </div>

                    <div class="row">
                        <div class="cell label">생년월일</div>
                        <div class="cell input">
                            <input
                                type="date"
                                bind:value={agentBirthdate}
                                placeholder=""
                                autocomplete="off"
                            />
                        </div>
                    </div>

                    <div class="row">
                        <div class="cell label">환자와의 관계*</div>
                        <div class="cell input">
                            <div class="select-wrap">
                                <select bind:value={agentRelation}>
                                    <option value="방문간호사"
                                        >방문간호사</option
                                    >
                                    <option value="방문간호조무사"
                                        >방문간호조무사</option
                                    >
                                </select>
                                <span class="select-arrow">▼</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 방문간호사 확인사항 -->
            <div class="box mt">
                <div class="para">
                    환자는 비대면진료 및 비대면조제 시 본인부담금이 추가로
                    발생할 수 있으며, 이에 대해 충분히 확인하고 동의합니다.
                </div>

                <div class="checks">
                    <label class="xe-check">
                        <input
                            type="radio"
                            name="consent"
                            value="동의"
                            bind:group={consent}
                        />
                        <span class="icon">
                            <i class="xi-check-square-o"></i>
                            <i class="xi-check-square"></i>
                        </span>
                        <span class="text">동의</span>
                    </label>

                    <label class="xe-check">
                        <input
                            type="radio"
                            name="consent"
                            value="비동의"
                            bind:group={consent}
                        />
                        <span class="icon">
                            <i class="xi-check-square-o"></i>
                            <i class="xi-check-square"></i>
                        </span>
                        <span class="text">비동의</span>
                    </label>
                </div>

                <div class="mt">
                    <div class="para">
                        위임인은 스마트경로당 연계 비대면 진료 사업과 관련하여
                        「비대면진료 시범사업 지침」에 따라 상기 대리인에게
                        의약품 대리수령을 위임하고 이에 동의합니다.
                    </div>
                </div>

                <!-- 서명 영역 (문서 서명란에 이미지가 “박힘”) -->
                <div class="sign-grid">
                    <div class="sign-box">
                        <div class="sign-head">
                            <div class="sign-who">환자 (위임인)</div>
                            <div class="sign-name">
                                성명: {mbrName?.trim() || ""}
                            </div>
                        </div>

                        <div class="sign-area">
                            {#if signatures.mbr}
                                <img
                                    class="sign-img"
                                    src={signatures.mbr}
                                    alt="위임인 서명"
                                />
                            {:else}
                                <div class="sign-placeholder">서명/날인</div>
                            {/if}
                        </div>

                        <!-- 캡처 숨김: 서명 버튼 -->
                        <div class="sign-actions" data-capture-hide="true">
                            <button
                                class="btn secondary"
                                type="button"
                                on:click={() => openSignModal("mbr")}
                                >서명하기</button
                            >
                        </div>
                    </div>

                    <div class="sign-box">
                        <div class="sign-head">
                            <div class="sign-who">대리인 (수임인)</div>
                            <div class="sign-name">
                                성명: {agentName?.trim() || ""}
                            </div>
                        </div>

                        <div class="sign-area">
                            {#if signatures.agent}
                                <img
                                    class="sign-img"
                                    src={signatures.agent}
                                    alt="수임인 서명"
                                />
                            {:else}
                                <div class="sign-placeholder">서명/날인</div>
                            {/if}
                        </div>

                        <div class="sign-actions" data-capture-hide="true">
                            <button
                                class="btn secondary"
                                type="button"
                                on:click={() => openSignModal("agent")}
                                >서명하기</button
                            >
                        </div>
                    </div>
                </div>

                <div class="date-line">
                    <div class="date-label">작성일</div>
                    <div class="date-input">
                        <input readonly bind:value={docDate} />
                    </div>
                </div>

                <div class="notice">
                    <div class="notice-title">유의사항</div>
                    <div class="notice-body">
                        1. 의약품 대리수령자의 범위 : 「의료법」 시행령
                        제10조의2(처방전 대리수령자의 범위) 제5호<br />
                        5) 그 밖에 환자의 계속적인 진료를 위해 필요한 경우로서 보건복지부장관이
                        인정하는 사람*<br />
                        * 환자의 주 보호자(방문간호사 등)로서 환자의 건강상태를 잘
                        알고 있고, 평소 진료시에도 동행하여 주치의가 대리상담하여
                        처방이 가능하다고 판단한 경우<br />
                        2. 마약류(마약, 향정신성의약품), 사후피임약, 비만치료제 등은
                        비대면진료 및 비대면조제 불가능
                    </div>
                </div>
            </div>
        </div>

        <div class="doc-header">
            <!-- 캡처에는 숨길 액션버튼 -->
            <div class="doc-actions" data-capture-hide="true">
                <button class="btn secondary" type="button" on:click={resetAll}
                    >초기화</button
                >
                <button
                    class="btn primary"
                    type="button"
                    on:click={saveAsSingleImage}>작성 완료</button
                >
            </div>
        </div>
    </div>

    <!-- 서명 모달 (어르신용 크게) -->
    {#if isSignModalOpen}
        <div
            class="modal-backdrop"
            on:click|self={closeSignModal}
            role="dialog"
            aria-modal="true"
        >
            <div class="modal" on:click|stopPropagation>
                <div class="modal-top">
                    <div class="modal-title">
                        {#if currentTarget === "mbr"}환자(위임인) 서명{:else}대리인(수임인)
                            서명{/if}
                    </div>
                    <div class="modal-actions">
                        <button
                            class="btn secondary"
                            type="button"
                            on:click={clearSignature}>지우기</button
                        >
                        <button
                            class="btn primary"
                            type="button"
                            on:click={applySignature}>적용</button
                        >
                    </div>
                </div>

                <div class="modal-body">
                    <div class="canvas-wrap">
                        <canvas bind:this={canvasEl}></canvas>
                    </div>
                    <div class="modal-hint">손가락/펜으로 크게 서명하세요.</div>
                </div>
            </div>
        </div>
    {/if}
</section>

<style>
    /* 기존 유지 */
    .contents {
        max-width: 1000px;
        margin: 0 auto;
        width: 100%;
        padding: 24px 24px 100px;
    }

    /* ===== PDF 느낌: A4 용지 레이아웃 ===== */
    .doc-wrap {
        width: 100%;
    }

    /* 상단 제목/버튼은 문서 바깥(캡처 시 숨김 처리 가능) */
    .doc-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-top: 14px;
    }
    .doc-actions {
        display: flex;
        gap: 10px;
    }

    .btn {
        appearance: none;
        border: 0;
        cursor: pointer;
        padding: 10px 14px;
        border-radius: 10px;
        font-weight: 500;
        font-size: 14px;
    }
    .btn.secondary {
        background: #fff;
        border: 1px solid rgba(0, 0, 0, 0.18);
    }
    .btn.primary {
        background: #e83535;
        color: #fff;
    }

    /* ===== “종이” ===== */
    .paper {
        background: #fff;
        /* A4 느낌: 너무 꽉 채우지 않고 종이 폭 느낌 */
        max-width: 820px; /* A4 폭 느낌(웹) */
        margin: 0 auto;
        border: 2px solid #111; /* PDF처럼 진하게 */
        padding: 18px 18px 22px;
        border-radius: 0; /* 문서 느낌 위해 각지게 */
    }

    /* 문서 최상단 큰 제목(중앙) */
    .paper .big-title {
        text-align: center;
        font-size: 22px;
        font-weight: 900;
        margin: 6px 0 14px;
    }

    /* 섹션 박스 */
    .box {
        border: 1px solid #111;
        border-radius: 0;
        overflow: hidden;
        background: #fff;
        margin-top: 10px;
    }
    .box:first-child {
        margin-top: 0;
    }

    .box-title {
        padding: 10px 12px;
        font-weight: 900;
        font-size: 14px;
        background: #f3f4f6;
        border-bottom: 1px solid #111;
    }

    /* 표 느낌 */
    .row {
        display: grid;
        grid-template-columns: 140px 1fr;
        border-bottom: 1px solid #111;
    }
    .row:last-child {
        border-bottom: 0;
    }

    .cell {
        padding: 10px 10px;
    }
    .cell.label {
        background: #f9fafb;
        font-weight: 900;
        color: #111;
        border-right: 1px solid #111;
        display: flex;
        align-items: center;
    }
    .cell.input input {
        width: 100%;
        border: none; /* PDF 칸 느낌 */
        outline: none;
        font-size: 16px;
        padding: 6px 8px;
        background: transparent;
    }
    .cell.input input:focus {
        background: rgba(232, 53, 53, 0.08);
    }

    /* 캡처 시 추가된 임시 텍스트 스타일 */
    .temp-capture-text {
        width: 100%;
        text-align: left;
        font-weight: 500;
    }

    /* select 래퍼 */
    .select-wrap {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        min-height: 40px; /* 높이를 명시적으로 주어 텍스트와 select가 교체될 때 덜컹거림 방지 */
    }

    /* select 자체 */
    .select-wrap select {
        width: 100%;
        border: none;
        outline: none;
        font-size: 16px;
        padding: 6px 32px 6px 8px; /* 오른쪽 화살표 공간 확보 */
        background: transparent;
        appearance: none; /* 기본 화살표 제거 */
        -webkit-appearance: none;
        -moz-appearance: none;
        cursor: pointer;
    }

    /* 포커스 시 문서 강조 */
    .select-wrap select:focus {
        background: rgba(232, 53, 53, 0.08);
    }

    /* ▼ 화살표 */
    .select-arrow {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none; /* 클릭은 select로 */
        font-size: 12px;
        font-weight: 900;
        color: #111;
    }

    /* 문단/설명 */
    .para {
        padding: 12px;
        font-size: 14px;
        line-height: 1.7;
        color: #111;
    }

    .checks {
        display: flex;
        gap: 22px;
        padding: 12px;
        border-bottom: 1px solid #111;
        align-items: center;
        flex-wrap: wrap;
    }

    .xe-check {
        position: relative;
        display: inline-flex;
        align-items: center; /* ✅ 아이콘/글자 수직 중앙 */
        gap: 10px;
        font-weight: 900;
        color: #111;
        cursor: pointer;
        user-select: none;
        line-height: 1; /* ✅ baseline 흔들림 방지 */
    }

    .xe-check input {
        position: absolute;
        opacity: 0;
        width: 1px;
        height: 1px;
    }
    /* 아이콘 박스 */
    .xe-check .icon {
        position: relative;
        width: 26px;
        height: 26px;
        flex: 0 0 26px; /* ✅ flex 줄어듦 방지 */
        display: inline-block;
    }

    /* 아이콘 중앙 고정 */
    .xe-check .icon i {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        line-height: 1;
    }

    /* 텍스트도 중앙 */
    .xe-check .text {
        display: inline-flex;
        align-items: center;
        line-height: 1; /* ✅ 글자 baseline 흔들림 방지 */
        font-size: 16px; /* 필요하면 조절 */
    }

    /* 기본은 빈 네모만 보이기 */
    .xe-check .xi-check-square {
        display: none;
    }

    /* 체크되면 토글 */
    .xe-check input:checked + .icon .xi-check-square-o {
        display: none;
    }
    .xe-check input:checked + .icon .xi-check-square {
        display: flex;
        color: white;
    }

    /* 날짜 줄 */
    .date-line {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-top: 1px solid #111;
    }
    .date-label {
        font-weight: 900;
        width: 70px;
    }
    .date-input {
        flex: 1;
    }
    .date-input input {
        width: 100%;
        border: none;
        border-bottom: 1px solid #111; /* PDF 빈칸 느낌 */
        border-radius: 0;
        padding: 8px 6px;
        font-size: 16px;
        outline: none;
    }
    .date-input input:focus {
        background: rgba(232, 53, 53, 0.08);
    }

    /* ===== 서명란: PDF처럼 “서명/날인” 칸 ===== */
    .sign-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        padding: 12px;
    }
    @media (min-width: 860px) {
        .sign-grid {
            grid-template-columns: 1fr 1fr;
        }
    }

    .sign-box {
        border: 1px solid #111;
        border-radius: 0;
        overflow: hidden;
    }

    .sign-head {
        padding: 10px 10px;
        border-bottom: 1px solid #111;
        background: #f9fafb;
    }
    .sign-who {
        font-weight: 900;
    }
    .sign-name {
        margin-top: 4px;
        font-weight: 900;
    }

    .sign-area {
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
    }
    .sign-placeholder {
        font-weight: 900;
        color: #6b7280;
    }
    .sign-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    /* 서명 버튼은 캡처에서 숨김(이미지엔 버튼 제외) */
    .sign-actions {
        padding: 10px;
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid #111;
    }

    /* 유의사항 */
    .notice {
        padding: 12px;
        border-top: 2px solid #111;
        background: #fff;
    }
    .notice-title {
        font-weight: 900;
        margin-bottom: 6px;
    }
    .notice-body {
        font-size: 12px;
        line-height: 1.7;
        color: #111;
    }

    /* ===== 모달: 서명 크게 ===== */
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 9999;
    }
    .modal {
        width: min(980px, 100%);
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
    }
    .modal-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.15);
    }
    .modal-title {
        font-weight: 900;
        font-size: 16px;
    }
    .modal-actions {
        display: flex;
        gap: 10px;
    }
    .modal-body {
        padding: 14px;
    }

    .canvas-wrap {
        border: 2px solid #111;
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
        touch-action: none; /* 서명 중 스크롤/줌 충돌 방지 */
    }
    canvas {
        width: 100%;
        height: 520px; /* 태블릿 크게 */
        display: block;
    }
    .modal-hint {
        margin-top: 10px;
        font-size: 12px;
        font-weight: 900;
        color: #374151;
    }
</style>
