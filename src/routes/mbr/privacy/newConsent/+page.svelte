<script>
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import { apiServerAddr } from "$lib/js/urlAddr";
  import { getAPI } from "$lib/js/getAPI";
  import { isLogin } from "$lib/store/loginStore";
  import { updateRefresh } from "$lib/js/updateRefresh";
  import { onMount, tick } from "svelte";

  import SignaturePad from "signature_pad";
  import html2canvas from "html2canvas";

  let jwt = "";
  let refresh = "";

  // ===== 문서 입력값 =====
  let mbrName = "";
  let mbrPhone = "";
  let mbrBirthdate = "";
  let mbrAddress = "";
  let centerName = "";

  // 서버 DTO 키에 맞춤
  let agree = ""; // "동의" | "비동의" (개인정보 수집·이용) - 필수
  let bioAgree = ""; // "동의" | "비동의" (민감정보/건강정보) - 선택이지만 선택값은 필수
  let docDate = "";

  // ===== 서명 이미지 (dataURL) =====
  let signature = null;

  // ===== 서명 모달 =====
  let isSignModalOpen = false;
  let canvasEl = null;
  let sigPad = null;

  // ===== 캡처 대상(전자문서 전체) =====
  let captureRootEl = null;

  function gotoPage(url) {
    goto(url);
  }

  function formatKoreanDate(d = new Date()) {
    const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const y = kst.getFullYear();
    const m = String(kst.getMonth() + 1).padStart(2, "0");
    const day = String(kst.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  }

  function lockBodyScroll(lock) {
    document.body.style.overflow = lock ? "hidden" : "";
    document.body.style.touchAction = lock ? "none" : "";
  }

  async function openSignModal() {
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

    if (signature) {
      sigPad.fromDataURL(signature, { ratio: 1 });
    }
  }

  function closeSignModal() {
    isSignModalOpen = false;
    sigPad = null;
    lockBodyScroll(false);
  }

  function clearSignature() {
    sigPad && sigPad.clear();
  }

  function applySignature() {
    if (!sigPad) return;
    if (sigPad.isEmpty()) {
      alert("서명을 해주세요.");
      return;
    }
    signature = sigPad.toDataURL("image/png");
    closeSignModal();
  }

  function resetAll() {
    if (!confirm("입력/서명을 모두 초기화할까요?")) return;

    mbrName = "";
    mbrPhone = "";
    mbrBirthdate = "";
    mbrAddress = "";
    centerName = "";

    agree = "";
    bioAgree = "";
    signature = null;

    // 작성일은 오늘로 다시
    docDate = formatKoreanDate();
  }

  function validateBeforeSave() {
    if (!mbrName.trim()) return "성명을 입력해주세요.";
    if (!mbrPhone.trim()) return "연락처를 입력해주세요.";
    if (!mbrBirthdate) return "생년월일을 입력해주세요.";
    if (!mbrAddress.trim()) return "주소를 입력해주세요.";
    if (!centerName.trim()) return "경로당명을 입력해주세요.";

    if (!agree) return "개인정보 수집·이용 동의/비동의를 선택해주세요.";
    if (agree !== "동의")
      return "개인정보 수집·이용에 동의해야 서비스를 이용할 수 있습니다.";

    // 선택 항목이더라도 서버는 bioAgree.equals("동의") 쓰므로 값 자체는 반드시 내려가야 안전함
    if (!bioAgree) return "민감정보(건강정보) 동의/비동의를 선택해주세요.";

    if (!docDate.trim()) return "작성일이 없습니다.";
    if (!signature) return "서명이 필요합니다.";

    return null;
  }

  function safeFileName(name) {
    return (name || "미입력").replace(/[\\/:*?"<>|]/g, "_");
  }

  async function saveAsSingleImage() {
    const err = validateBeforeSave();
    if (err) return alert(err);
    if (!captureRootEl) return;

    const prevScrollY = window.scrollY;
    window.scrollTo(0, 0);

    // 캡처에서 숨길 요소들
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
      const ymd = docDate.replace(/\D/g, "").slice(0, 8) || "date";
      const filename = `${ymd}_개인정보이용동의서_${safeFileName(mbrName)}.png`;

      const result = await uploadPrivacyConsentToServer(dataUrl, filename, {
        mbrName,
        mbrAddress,
        centerName,
        agree, // ✅ 서버 DTO 키
        bioAgree, // ✅ 서버 DTO 키
        docDate,
      });

      alert("동의서 작성이 완료되었습니다.");
      goto("/mbr/privacy/consent", { replaceState: true });
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      hideEls.forEach((el) => (el.style.display = ""));
      window.scrollTo(0, prevScrollY);
    }
  }

  async function uploadPrivacyConsentToServer(dataUrl, filename, meta) {
    const base64 = dataUrl.split(",")[1];

    const res = await fetch(`${apiServerAddr}/v1/consents/privacy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwt ? { "bizportal-access-token": jwt } : {}),
      },
      body: JSON.stringify({
        filename,
        imageBase64: base64,
        meta,
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`upload failed: ${res.status} ${t}`);
    }

    const json = await res.json();

    // ✅ 현재 서버 포맷 기준 성공 판정
    // 보통 code=0, status=0 이면 성공
    const isSuccess =
      json?.code === 0 ||
      json?.status === 0 ||
      String(json?.message || "").toLowerCase() === "success";

    if (!isSuccess) {
      throw new Error(`api error: ${JSON.stringify(json)}`);
    }

    return json?.resultVO ?? json;
  }

  function onResize() {
    if (!isSignModalOpen) return;
    setTimeout(() => resizeSignatureCanvasAndRestore(), 0);
  }

  onMount(async () => {
    docDate = formatKoreanDate();

    jwt = localStorage.getItem("userJwt") || "";
    refresh = localStorage.getItem("refreshJwt") || "";

    // 사용자 정보 자동 채움
    try {
      const url = apiServerAddr + "/v1/member/selectMemberInfo";
      const result = await getAPI(url, jwt);

      mbrName = result?.mbrName ?? "";
      mbrPhone = result?.mbrTel ?? "";
      mbrBirthdate = result?.mdtlBrth ?? "";
      mbrAddress = `${result.mbrAddr} ${result.mbrAddrDtl}`;

      if (result.mbrCenterId != 0) {
        const url = apiServerAddr + "/v1/member/center";
        const result = await getAPI(url, jwt);
        centerName = `${result.region} ${result.name}경로당`
      }
      
      
    } catch (err) {
      console.log(err);
      try {
        if (err?.message == "21009") {
          await updateRefresh(refresh);
          location.reload();
        } else {
          console.error(err);
        }
      } catch (err2) {
        console.error(err2);
        localStorage.setItem("refreshJwt", "");
        localStorage.setItem("userJwt", "");
        alert("토큰 재발급 오류 발생. 다시 로그인해주세요");
        $isLogin = false;
        goto(urlList.uaLogin);
      }
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });
</script>

<Nav>개인정보 수집 및 이용 동의서</Nav>

<section class="contents">
  <div class="doc-wrap" bind:this={captureRootEl}>
    <div class="paper">
      <div class="big-title">개인정보 수집 및 이용 동의서</div>

      <div class="para">
        남원시는 「개인정보 보호법」 제15조 및 제22조에 따라 ‘어르신 행복공간
        스마트 경로당 사업’ 추진과 관련하여 아래와 같이 개인정보 및 민감정보를
        수집·이용합니다. 본인은 아래 내용을 충분히 설명받고 이해하였으며, 동의
        여부를 자율적으로 선택합니다.
      </div>

      <!-- 1) 대상자 정보 -->
      <div class="box">
        <div class="box-title">대상자(본인) 정보</div>

        <div class="row">
          <div class="cell label">성명</div>
          <div class="cell input">
            <input bind:value={mbrName} autocomplete="off" />
          </div>
        </div>

        <div class="row">
          <div class="cell label">연락처</div>
          <div class="cell input">
            <input bind:value={mbrPhone} autocomplete="off" inputmode="tel" />
          </div>
        </div>

        <div class="row">
          <div class="cell label">생년월일</div>
          <div class="cell input">
            <input type="date" bind:value={mbrBirthdate} autocomplete="off" />
          </div>
        </div>

        <div class="row">
          <div class="cell label">주소</div>
          <div class="cell input">
            <input bind:value={mbrAddress} autocomplete="off" />
          </div>
        </div>

        <div class="row">
          <div class="cell label">경로당 명</div>
          <div class="cell input">
            <input
              bind:value={centerName}
              autocomplete="off"
              placeholder="예) OO경로당"
            />
          </div>
        </div>
      </div>

      <!-- 2) 목적 -->
      <div class="box mt">
        <div class="box-title">개인정보 수집·이용 목적</div>
        <div class="para">
          • 비대면 진료 플랫폼 이용자 본인확인 및 등록·관리<br />
          • 건강 측정 결과 확인 및 비대면 진료·상담 서비스 제공<br />
          • 서비스 운영 및 행정 처리<br />
          • 사업 성과 분석 및 정책 수립을 위한 통계자료 활용
        </div>
      </div>

      <!-- 3) 수집 항목 -->
      <div class="box mt">
        <div class="box-title">수집·이용 항목</div>

        <div class="para">
          <b>① 개인정보(필수)</b><br />
          • 성명, 생년월일, 성별, 주소, 연락처, 경로당 명
        </div>

        <div class="para" style="border-top:1px solid #111;">
          <b>② 민감정보(건강정보)</b><br />
          • 혈압, 혈당, 체성분, 맥박, 청진음, 산소포화도<br />
          <span style="color:#374151;font-weight:900;">
            ※ 민감정보는 개별 항목이 아닌 “전체 항목”에 대해 동의/비동의를
            선택합니다.
          </span>
        </div>

        <div class="para" style="border-top:1px solid #111;">
          <b>③ 기타</b><br />
          • 서비스 이용 이력, 온라인 결제 내역, 상담 및 처방 내역
        </div>
      </div>

      <!-- 4) 보유 기간 -->
      <div class="box mt">
        <div class="box-title">보유·이용 기간</div>
        <div class="para">
          • 민감정보는 관련 법령에 따라 수집일로부터 최대 10년 보유할 수
          있습니다.<br />
          • 보유기간 경과 시 관련 법령 및 내부 지침에 따라 파기됩니다.
        </div>
      </div>

      <!-- 5) 동의 선택 -->
      <div class="box mt">
        <div class="box-title">동의 여부</div>

        <div class="para"><b>개인정보 수집·이용 동의(필수)</b></div>

        <div class="checks">
          <label class="xe-check">
            <input type="radio" name="agree" value="동의" bind:group={agree} />
            <span class="icon"
              ><i class="xi-check-square-o"></i><i class="xi-check-square"
              ></i></span
            >
            <span class="text">동의</span>
          </label>

          <label class="xe-check">
            <input
              type="radio"
              name="agree"
              value="비동의"
              bind:group={agree}
            />
            <span class="icon"
              ><i class="xi-check-square-o"></i><i class="xi-check-square"
              ></i></span
            >
            <span class="text">비동의</span>
          </label>
        </div>

        <div class="para" style="border-top:1px solid #111;">
          <b>민감정보(건강정보) 수집·이용 동의(선택)</b>
        </div>

        <div class="checks">
          <label class="xe-check">
            <input
              type="radio"
              name="bioAgree"
              value="동의"
              bind:group={bioAgree}
            />
            <span class="icon"
              ><i class="xi-check-square-o"></i><i class="xi-check-square"
              ></i></span
            >
            <span class="text">동의</span>
          </label>

          <label class="xe-check">
            <input
              type="radio"
              name="bioAgree"
              value="비동의"
              bind:group={bioAgree}
            />
            <span class="icon"
              ><i class="xi-check-square-o"></i><i class="xi-check-square"
              ></i></span
            >
            <span class="text">비동의</span>
          </label>
        </div>

        <div class="para" style="border-top:1px solid #111;">
          • 귀하는 동의를 거부할 권리가 있습니다.<br />
          • 개인정보 수집·이용을 거부할 경우 서비스 제공이 제한될 수 있습니다.
        </div>
      </div>

      <!-- 6) 서명 -->
      <div class="box mt">
        <div class="box-title">확인 및 서명</div>

        <div class="para">
          본인은 위 내용을 충분히 이해하였으며, 전자문서를 통해 동의합니다.
        </div>

        <div class="sign-box" style="margin:12px; border:1px solid #111;">
          <div class="sign-head">
            <div class="sign-who">본인 서명</div>
            <div class="sign-name">성명: {mbrName?.trim() || ""}</div>
          </div>

          <div class="sign-area">
            {#if signature}
              <img class="sign-img" src={signature} alt="서명" />
            {:else}
              <div class="sign-placeholder">서명/날인</div>
            {/if}
          </div>

          <div class="sign-actions" data-capture-hide="true">
            <button class="btn secondary" type="button" on:click={openSignModal}
              >서명하기</button
            >
          </div>
        </div>

        <div class="date-line">
          <div class="date-label">작성일</div>
          <div class="date-input">
            <input readonly bind:value={docDate} />
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ 하단 액션 버튼 (캡처 제외) -->
    <div class="bottom-actions" data-capture-hide="true">
      <button class="btn secondary" type="button" on:click={resetAll}
        >초기화</button
      >
      <button class="btn primary" type="button" on:click={saveAsSingleImage}
        >작성 완료</button
      >
    </div>
  </div>

  <!-- 서명 모달 -->
  {#if isSignModalOpen}
    <div
      class="modal-backdrop"
      on:click|self={closeSignModal}
      role="dialog"
      aria-modal="true"
    >
      <div class="modal" on:click|stopPropagation>
        <div class="modal-top">
          <div class="modal-title">서명</div>
          <div class="modal-actions">
            <button
              class="btn secondary"
              type="button"
              on:click={clearSignature}>지우기</button
            >
            <button class="btn primary" type="button" on:click={applySignature}
              >적용</button
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
  .contents {
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
    padding: 24px 24px 100px;
  }

  .doc-wrap {
    width: 100%;
  }

  .btn {
    appearance: none;
    border: 0;
    cursor: pointer;
    padding: 12px 14px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 1.2em;
  }
  .btn.secondary {
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.18);
  }
  .btn.primary {
    background: #e83535;
    color: #fff;
  }

  .paper {
    background: #fff;
    max-width: 820px;
    margin: 0 auto;
    border: 2px solid #111;
    padding: 18px 18px 22px;
    border-radius: 0;
  }

  .big-title {
    text-align: center;
    font-size: 22px;
    font-weight: 900;
    margin: 6px 0 14px;
  }

  .box {
    border: 1px solid #111;
    border-radius: 0;
    overflow: hidden;
    background: #fff;
    margin-top: 10px;
  }
  .box-title {
    padding: 10px 12px;
    font-weight: 900;
    font-size: 14px;
    background: #f3f4f6;
    border-bottom: 1px solid #111;
  }

  .mt {
    margin-top: 12px;
  }

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
    border: none;
    outline: none;
    font-size: 16px;
    padding: 6px 8px;
    background: transparent;
  }
  .cell.input input:focus {
    background: rgba(232, 53, 53, 0.08);
  }

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
    align-items: center;
    flex-wrap: wrap;
  }

  .xe-check {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 900;
    color: #111;
    cursor: pointer;
    user-select: none;
    line-height: 1;
  }

  .xe-check input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }

  .xe-check .icon {
    position: relative;
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    display: inline-block;
  }

  .xe-check .icon i {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    line-height: 1;
  }

  .xe-check .text {
    display: inline-flex;
    align-items: center;
    line-height: 1;
    font-size: 16px;
  }

  .xe-check .xi-check-square {
    display: none;
  }

  .xe-check input:checked + .icon .xi-check-square-o {
    display: none;
  }
  .xe-check input:checked + .icon .xi-check-square {
    display: flex;
    color: white;
  }

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
    border-bottom: 1px solid #111;
    border-radius: 0;
    padding: 8px 6px;
    font-size: 16px;
    outline: none;
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
    height: 160px;
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

  .sign-actions {
    padding: 10px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #111;
  }

  /* ✅ 하단 버튼 */
  .bottom-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    padding: 14px 12px;
    margin-top: 12px;
  }

  /* ===== 모달 ===== */
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
    touch-action: none;
  }
  canvas {
    width: 100%;
    height: 520px;
    display: block;
  }
  .modal-hint {
    margin-top: 10px;
    font-size: 12px;
    font-weight: 900;
    color: #374151;
  }
</style>
