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
  let id = "";

  function gotoPage(url) {
    goto(url);
  }

  // ===== 전자문서 입력값 (PDF 항목 그대로) =====
  let grantorName = "";
  let grantorTel = "";
  let grantorBirth = "";
  let grantorAddr = "";

  let agentName = "";
  let agentTel = "";
  let agentBirth = "";
  let agentRelation = "";

  let consent = ""; // "동의" | "비동의"
  let docDate = ""; // "20  년  월  일" 형태/또는 "2025년 12월 28일"

  // ===== 서명 이미지 (dataURL) =====
  let signatures = { grantor: null, agent: null };

  // ===== 서명 모달 =====
  let isSignModalOpen = false;
  let currentTarget = null; // "grantor" | "agent"
  let canvasEl = null;
  let sigPad = null;

  // ===== 캡처 대상(전자문서 전체) =====
  let captureRootEl = null;

  onMount(async () => {
    // 여기는 너 프로젝트 로그인/토큰 로직에 맞춰 채워
    // 예: jwt/refresh/id 세팅, refresh 갱신, 로그인 체크 등
    // jwt = ...
    // refresh = ...
    // id = ...
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
      penColor: "#111827"
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

    grantorName = "";
    grantorTel = "";
    grantorBirth = "";
    grantorAddr = "";

    agentName = "";
    agentTel = "";
    agentBirth = "";
    agentRelation = "";

    consent = "";
    docDate = "";

    signatures = { grantor: null, agent: null };
  }

  function validateBeforeSave() {
    if (!consent) return "동의/비동의를 선택해주세요.";
    if (!grantorName.trim()) return "위임인(환자) 성명을 입력해주세요.";
    if (!agentName.trim()) return "수임인(대리수령자) 성명을 입력해주세요.";
    if (!docDate.trim()) return "작성일을 입력해주세요.";
    if (!signatures.grantor) return "환자(위임인) 서명이 필요합니다.";
    if (!signatures.agent) return "대리인(수임인) 서명이 필요합니다.";
    return null;
  }

  // 최종: 전자문서 전체를 1장 PNG로 캡처 후 업로드
  async function saveAsSingleImage() {
    const err = validateBeforeSave();
    if (err) return alert(err);

    if (!captureRootEl) return;

    const prevScrollY = window.scrollY;
    window.scrollTo(0, 0);

    // 캡처 시 버튼 영역 숨김 처리(저장 이미지 깔끔하게)
    const hideEls = captureRootEl.querySelectorAll("[data-capture-hide='true']");
    hideEls.forEach((el) => (el.style.display = "none"));

    try {
      const canvas = await html2canvas(captureRootEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1];

      // TODO: 엔드포인트는 너희 서버 규격에 맞춰 변경
      const res = await fetch(`${apiServerAddr}/consent/save-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({
          docType: "DRUG_PROXY_RECEIPT_CONSENT",
          imageBase64: base64,
          meta: {
            grantorName,
            grantorTel,
            grantorBirth,
            grantorAddr,
            agentName,
            agentTel,
            agentBirth,
            agentRelation,
            consent,
            docDate
          }
        })
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`save failed: ${res.status} ${t}`);
      }

      alert("저장 완료");
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      hideEls.forEach((el) => (el.style.display = ""));
      window.scrollTo(0, prevScrollY);
    }
  }

  // 모달 열린 상태에서 회전/리사이즈 대응
  function onResize() {
    if (!isSignModalOpen) return;
    setTimeout(() => resizeSignatureCanvasAndRestore(), 0);
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
    <div class="doc-header">
      <div class="doc-title">약 대리수령 동의서 및 위임장</div>

      <!-- 캡처에는 숨길 액션버튼 -->
      <div class="doc-actions" data-capture-hide="true">
        <button class="btn secondary" type="button" on:click={resetAll}>초기화</button>
        <button class="btn primary" type="button" on:click={saveAsSingleImage}>최종 저장</button>
      </div>
    </div>

    <!-- 문서 본문: PDF 서식처럼 박스/라인 구성 -->
    <div class="paper">
      <div class="grid2">
        <!-- 위임인 -->
        <div class="box">
          <div class="box-title">동의 및 위임자 (위임인)</div>

          <div class="row">
            <div class="cell label">성명</div>
            <div class="cell input">
              <input bind:value={grantorName} placeholder="" autocomplete="off" />
            </div>
          </div>

          <div class="row">
            <div class="cell label">연락처</div>
            <div class="cell input">
              <input bind:value={grantorTel} placeholder="" autocomplete="off" inputmode="tel" />
            </div>
          </div>

          <div class="row">
            <div class="cell label">생년월일</div>
            <div class="cell input">
              <input bind:value={grantorBirth} placeholder="" autocomplete="off" />
            </div>
          </div>

          <div class="row">
            <div class="cell label">주소</div>
            <div class="cell input">
              <input bind:value={grantorAddr} placeholder="" autocomplete="off" />
            </div>
          </div>
        </div>

        <!-- 수임인 -->
        <div class="box">
          <div class="box-title">대리 수령자 (수임인)</div>

          <div class="row">
            <div class="cell label">성명</div>
            <div class="cell input">
              <input bind:value={agentName} placeholder="" autocomplete="off" />
            </div>
          </div>

          <div class="row">
            <div class="cell label">연락처</div>
            <div class="cell input">
              <input bind:value={agentTel} placeholder="" autocomplete="off" inputmode="tel" />
            </div>
          </div>

          <div class="row">
            <div class="cell label">생년월일</div>
            <div class="cell input">
              <input bind:value={agentBirth} placeholder="" autocomplete="off" />
            </div>
          </div>

          <div class="row">
            <div class="cell label">환자와의 관계*</div>
            <div class="cell input">
              <input bind:value={agentRelation} placeholder="" autocomplete="off" />
            </div>
          </div>
        </div>
      </div>

      <!-- 방문간호사 확인사항 -->
      <div class="box mt">
        <div class="box-title">방문간호사 확인사항</div>

        <div class="checks">
          <label class="check">
            <input type="radio" name="consent" value="동의" bind:group={consent} />
            <span>동의</span>
          </label>
          <label class="check">
            <input type="radio" name="consent" value="비동의" bind:group={consent} />
            <span>비동의</span>
          </label>
        </div>

        <div class="para">
          환자는 비대면진료 및 비대면조제 시 본인부담금이 추가로 발생할 수 있으며, 이에 대해 충분히 확인하고 동의합니다.
          위임인은 스마트경로당 연계 비대면 진료 사업과 관련하여 「비대면진료 시범사업 지침」에 따라 상기 대리인에게 의약품 대리수령을 위임하고 이에 동의합니다.
        </div>

        <div class="date-line">
          <div class="date-label">작성일</div>
          <div class="date-input">
            <input bind:value={docDate} placeholder="예) 2025년 12월 28일" autocomplete="off" />
          </div>
        </div>

        <!-- 서명 영역 (문서 서명란에 이미지가 “박힘”) -->
        <div class="sign-grid">
          <div class="sign-box">
            <div class="sign-head">
              <div class="sign-who">환자 (위임인)</div>
              <div class="sign-name">성명: {grantorName?.trim() || ""}</div>
            </div>

            <div class="sign-area">
              {#if signatures.grantor}
                <img class="sign-img" src={signatures.grantor} alt="위임인 서명" />
              {:else}
                <div class="sign-placeholder">서명/날인</div>
              {/if}
            </div>

            <!-- 캡처 숨김: 서명 버튼 -->
            <div class="sign-actions" data-capture-hide="true">
              <button class="btn secondary" type="button" on:click={() => openSignModal("grantor")}>서명하기</button>
            </div>
          </div>

          <div class="sign-box">
            <div class="sign-head">
              <div class="sign-who">대리인 (수임인)</div>
              <div class="sign-name">성명: {agentName?.trim() || ""}</div>
            </div>

            <div class="sign-area">
              {#if signatures.agent}
                <img class="sign-img" src={signatures.agent} alt="수임인 서명" />
              {:else}
                <div class="sign-placeholder">서명/날인</div>
              {/if}
            </div>

            <div class="sign-actions" data-capture-hide="true">
              <button class="btn secondary" type="button" on:click={() => openSignModal("agent")}>서명하기</button>
            </div>
          </div>
        </div>

        <div class="notice">
          <div class="notice-title">유의사항</div>
          <div class="notice-body">
            1. 의약품 대리수령자의 범위 : 「의료법」 시행령 제10조의2(처방전 대리수령자의 범위) 제5호<br/>
            5) 그 밖에 환자의 계속적인 진료를 위해 필요한 경우로서 보건복지부장관이 인정하는 사람*<br/>
            * 환자의 주 보호자(방문간호사 등)로서 환자의 건강상태를 잘 알고 있고, 평소 진료시에도 동행하여 주치의가 대리상담하여 처방이 가능하다고 판단한 경우<br/>
            2. 마약류(마약, 향정신성의약품), 사후피임약, 비만치료제 등은 비대면진료 및 비대면조제 불가능
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 서명 모달 (어르신용 크게) -->
  {#if isSignModalOpen}
    <div class="modal-backdrop" on:click|self={closeSignModal} role="dialog" aria-modal="true">
      <div class="modal" on:click|stopPropagation>
        <div class="modal-top">
          <div class="modal-title">
            {#if currentTarget === "grantor"}환자(위임인) 서명{:else}대리인(수임인) 서명{/if}
          </div>
          <div class="modal-actions">
            <button class="btn secondary" type="button" on:click={clearSignature}>지우기</button>
            <button class="btn primary" type="button" on:click={applySignature}>적용</button>
          </div>
        </div>

        <div class="modal-body">
          <div class="canvas-wrap">
            <canvas bind:this={canvasEl}></canvas>
          </div>
          <div class="modal-hint">
            손가락/펜으로 크게 서명하세요.
          </div>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  /* 사용자 제공 */
  .contents {
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
    padding: 24px 24px 100px;
  }

  /* 문서 컨테이너 */
  .doc-wrap { width: 100%; }
  .doc-header {
    display:flex; align-items:flex-end; justify-content:space-between; gap:12px;
    margin-bottom: 14px;
  }
  .doc-title { font-size: 20px; font-weight: 900; letter-spacing: -0.2px; }
  .doc-actions { display:flex; gap:10px; }

  .btn{
    appearance:none; border:0; cursor:pointer;
    padding: 12px 14px; border-radius: 12px;
    font-weight: 900; font-size: 14px;
  }
  .btn.secondary{
    background:#fff;
    border:1px solid rgba(0,0,0,.12);
  }
  .btn.primary{
    background:#e83535;
    color:#fff;
  }

  /* 전자문서(종이) */
  .paper{
    background:#fff;
    border-radius: 16px;
    border: 1px solid rgba(0,0,0,.10);
    padding: 18px;
  }

  .grid2{
    display:grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 860px){
    .grid2{ grid-template-columns: 1fr 1fr; }
  }

  .box{
    border:1px solid rgba(0,0,0,.12);
    border-radius: 14px;
    overflow:hidden;
    background:#fff;
  }
  .box-title{
    padding: 12px 14px;
    font-weight: 900;
    font-size: 14px;
    background: #f8fafc;
    border-bottom: 1px solid rgba(0,0,0,.08);
  }

  /* 표 형태 */
  .row{
    display:grid;
    grid-template-columns: 130px 1fr;
    border-bottom: 1px solid rgba(0,0,0,.08);
  }
  .row:last-child{ border-bottom:0; }

  .cell{ padding: 12px 12px; }
  .cell.label{
    background:#fbfbfb;
    font-weight: 800;
    color: #374151;
    border-right: 1px solid rgba(0,0,0,.08);
  }
  .cell.input input{
    width:100%;
    border:1px solid rgba(0,0,0,.12);
    border-radius: 10px;
    padding: 12px 12px;
    font-size: 16px;
    outline:none;
  }
  .cell.input input:focus{
    border-color: rgba(232,53,53,.6);
    box-shadow: 0 0 0 4px rgba(232,53,53,.12);
  }

  .mt{ margin-top: 14px; }

  .checks{
    display:flex; gap:16px; padding: 14px;
    border-bottom: 1px solid rgba(0,0,0,.08);
    flex-wrap: wrap;
  }
  .check{
    display:flex; gap:10px; align-items:center;
    padding: 10px 12px;
    border: 1px solid rgba(0,0,0,.12);
    border-radius: 999px;
    font-weight: 900;
    background:#fff;
  }
  .check input{ width: 20px; height: 20px; }

  .para{
    padding: 14px;
    font-size: 14px;
    line-height: 1.6;
    color:#111827;
  }

  .date-line{
    display:flex; align-items:center; gap:12px; padding: 0 14px 14px;
  }
  .date-label{ font-weight: 900; }
  .date-input{ flex:1; }
  .date-input input{
    width:100%;
    border:1px solid rgba(0,0,0,.12);
    border-radius: 10px;
    padding: 12px 12px;
    font-size: 16px;
    outline:none;
  }

  /* 서명란 */
  .sign-grid{
    display:grid;
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 0 14px 14px;
  }
  @media (min-width: 860px){
    .sign-grid{ grid-template-columns: 1fr 1fr; }
  }

  .sign-box{
    border:1px solid rgba(0,0,0,.12);
    border-radius: 14px;
    overflow:hidden;
    background:#fff;
  }
  .sign-head{
    padding: 12px 12px;
    background:#f8fafc;
    border-bottom: 1px solid rgba(0,0,0,.08);
  }
  .sign-who{ font-weight: 900; }
  .sign-name{ margin-top: 4px; font-weight: 800; color:#374151; }

  .sign-area{
    height: 160px;
    display:flex;
    align-items:center;
    justify-content:center;
    border-bottom: 1px solid rgba(0,0,0,.08);
    background: linear-gradient(180deg, #fff, #fafafa);
  }
  .sign-placeholder{
    color:#6b7280;
    font-weight: 900;
  }
  .sign-img{
    width:100%;
    height:100%;
    object-fit: contain;
  }
  .sign-actions{
    padding: 12px;
    display:flex;
    justify-content:flex-end;
  }

  /* 유의사항 */
  .notice{
    padding: 14px;
    border-top: 1px solid rgba(0,0,0,.08);
    background:#fcfcfd;
  }
  .notice-title{ font-weight: 900; margin-bottom: 6px; }
  .notice-body{ font-size: 12px; color:#4b5563; line-height: 1.6; }

  /* 모달 */
  .modal-backdrop{
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.60);
    display:flex;
    align-items:center;
    justify-content:center;
    padding: 16px;
    z-index: 9999;
  }
  .modal{
    width: min(980px, 100%);
    background:#fff;
    border-radius: 18px;
    overflow:hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,.25);
  }
  .modal-top{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(0,0,0,.08);
  }
  .modal-title{
    font-weight: 900;
    font-size: 16px;
  }
  .modal-actions{
    display:flex; gap:10px;
  }
  .modal-body{
    padding: 14px;
  }
  .canvas-wrap{
    border: 2px solid rgba(0,0,0,.14);
    border-radius: 16px;
    overflow:hidden;
    background:#fff;
    touch-action: none; /* 서명 중 스크롤/줌 충돌 방지 */
  }
  canvas{
    width: 100%;
    height: 460px; /* 태블릿/어르신용 크게 */
    display:block;
  }
  .modal-hint{
    margin-top: 10px;
    color:#6b7280;
    font-size: 12px;
    font-weight: 800;
  }
</style>
