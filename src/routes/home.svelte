<script>
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
</script>

<body>
  <h1>비대면 하이브리드 솔루션 화면 퍼블리싱</h1>
  <div class="box">
    <ul>
      <li>-</li>
    </ul>
    <span>퍼블 최종 업데이트 : 2023-05-26</span>
  </div>
  <div class="container">
    <table cellspacing="0" cellpadding="0">
      <thead>
        <tr>
          <th colspan="6">메뉴구성</th>
        </tr>
        <tr>
          <th>1Depth</th>
          <th>2Depth</th>
          <th>상세</th>
          <th>레이어팝업</th>
          <th>화면ID</th>
          <th>비고</th>
        </tr>
      </thead>
      <tr>
        <td>로그인</td>
        <td />
        <td>사용자 인증</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-missing-attribute -->
          <a
            class="on"
            on:click={() => {
              goto(urlList.uaLogin);
            }}
          >
            uaLogin
          </a>
        </td>
        <td>카카오 간편 로그인</td>
      </tr>
      <tr>
        <td>회원가입</td>
        <td />
        <td>회원가입</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-missing-attribute -->
          <a
            class="on"
            on:click={() => {
              goto(urlList.uaMbrJoin);
            }}>uaMbrJoin</a
          ></td
        >
        <td>카카오 간편회원가입</td>
      </tr>
      <tr>
        <td />
        <td />
        <td>회원탈퇴</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaMbrExit);
            }}
            target="_blank">uaMbrExit</a
          >
        </td>
        <td />
      </tr>
      <!--
  <tr>
    <td>공통기능</td>
    <td>PUSH수신</td>
    <td>진료예약 PUSH 처리</td>
    <td></td>
    <td><a href="./view/sub/alarm_list.html" target="_blank">alarm_list</a></td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td>처방전 PUSH 처리</td>
    <td></td>
    <td><a href="./view/sub/join_con.html" target="_blank">join_con</a></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td>외부서비스 연동</td>
    <td>카카오 본인인증</td>
    <td></td>  
    <td><a href="./view/sub/join_info.html" target="_blank">join_info</a></td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td>화상진료</td>
    <td>화상진료</td>
    <td></td>
    <td><a href="./view/sub/join_findpw.html" target="_blank">join_findpw</a></td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td>신용카드결제</td>
    <td>신용카드결제</td>
    <td></td>
    <td><a href="./view/sub/join_changpw.html" target="_blank">join_changpw</a></td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td>지도연동</td>
    <td>병원/약국 지도 연동</td>
    <td></td>
    <td><a href="./view/sub/find_care.html" target="_blank" class="on">find_care</a></td>
    <td></td>
  </tr>
-->
      <tr>
        <td />
        <td>우편번호 검색</td>
        <td>우편번호 검색</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaZipSrch);
            }}
            target="_blank"
            class="on">uaZipSrch</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>상세정보</td>
        <td>진료예약상세</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaDgnsDtl);
            }}
            target="_blank">uaDgnsDtl</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>처방정보상세</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaPspnDtl);
            }}
            target="_blank">uaPspnDtl</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>병원 상세 정보</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaHptDtl);
            }}
            target="_blank">uaHptDtl</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>약국 상세 정보</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaDrstDtl);
            }}
            target="_blank">uaDrstDtl</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>공지사항 상세 정보</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaNtcDtl);
            }}
            target="_blank">uaNtcDtl</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td>홈</td>
        <td>사용자앱홈</td>
        <td>사용자앱홈</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaHome);
            }}
            target="_blank">uaHome</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>(검색)병원검색-키워드검색</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaHsptSrchKw);
            }}
            target="_blank">uaHsptSrchKw</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>(검색)병원검색-지도</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaHsptSrchMap);
            }}
            target="_blank">uaHsptSrchMap</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>(검색)약국검색-키워드검색</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaDrstSrchKw);
            }}
            target="_blank">uaDrstSrchKw</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>(검색)약국검색-지도</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaDrstSrchMap);
            }}
            target="_blank">uaDrstSrchMap</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td>마이페이지</td>
        <td />
        <td>마이페이지</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uamypage);
            }}
            target="_blank">uamypage</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>진료</td>
        <td>진료예약 목록</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaDgnsLst);
            }}
            target="_blank">uaDgnsLst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>신규예약 접수</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaDgnsRgst);
            }}
            target="_blank">uaDgnsRgst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>진료예약 확인</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaDgnsChk);
            }}
            target="_blank">uaDgnsChk</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>진료예약 변경</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaDgnsChng);
            }}
            target="_blank">uaDgnsChng</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>진료대기</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaVdodgnsWt);
            }}
            target="_blank">uaVdodgnsWt</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>장치 확인</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaVdodgnsChk);
            }}
            target="_blank">uaVdodgnsChk</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>화상진료</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaVdoDgns);
            }}
            target="_blank">uaVdoDgns</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>복약</td>
        <td>처방전 목록</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaPspnLst);
            }}
            target="_blank">uaPspnLst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>처방 접수 결제</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaPspnPay);
            }}
            target="_blank">uaPspnPay</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>처방 신규 접수</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaPspnRgst);
            }}
            target="_blank">uaPspnRgst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>단골 병원</td>
        <td>단골 병원 목록</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaFavHsptLst);
            }}
            target="_blank">uaFavHsptLst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>단골 병원 관리</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaFavHsptMng);
            }}
            target="_blank">uaFavHsptMng</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>단골 약국</td>
        <td>단골 약국 목록</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaFavDrstLst);
            }}
            target="_blank">uaFavDrstLst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>단골 약국 관리</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaFavDrstMng);
            }}
            target="_blank">uaFavDrstMng</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>공지사항</td>
        <td>공지사항 목록</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaNtctLst);
            }}
            target="_blank">uaNtctLst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>나의 건강기록</td>
        <td>나의 건강기록목록</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaMbrHlthLst);
            }}
            target="_blank">uaMbrHlthLst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>혈압(BP)</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaMbrBP);
            }}
            target="_blank">uaMbrBP</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>혈당</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaMbrBS);
            }}
            target="_blank">uaMbrBS</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>체중</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaMbrWgt);
            }}
            target="_blank">uaMbrWgt</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>체온 / 산소포화도</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaMbrTemp);
            }}
            target="_blank">uaMbrTemp</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>체성분( BMI/ CM / % )</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaMyBMI);
            }}
            target="_blank">uaMyBMI</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td>설정</td>
        <td />
        <td>환경설정 메뉴</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaSetting);
            }}
            target="_blank">uaSetting</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>회원정보관리</td>
        <td>회원정보수정</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaMbrInfo);
            }}
            target="_blank">uaMbrInfo</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>알람 및 동의</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaAlarmAgree);
            }}
            target="_blank">uaAlarmAgree</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>가족관리</td>
        <td>등록 가족 목록</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaFamLst);
            }}
            target="_blank">uaFamLst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>가족 등록/삭제</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaFamMng);
            }}
            target="_blank">uaFamMng</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>결제수단 관리</td>
        <td>결제수단목록</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaMbrCrdLst);
            }}
            target="_blank">uaMbrCrdLst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>결제 수단 등록</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaMbrCrdRgst);
            }}
            target="_blank">uaMbrCrdRgst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td>배송지관리</td>
        <td>배송지목록</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaDlvPlcLst);
            }}
            target="_blank">uaDlvPlcLst</a
          >
        </td>
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td>배송지추가</td>
        <td />
        <td>
          <!-- svelte-ignore a11y-missing-attribute -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <a
            on:click={() => {
              goto(urlList.uaDlvPlcMng);
            }}
            target="_blank">uaLDlvPlcMng</a
          >
        </td>
        <td />
      </tr>
    </table>
  </div>
</body>

<style>
  body {
    padding: 50px;
    display: block;
  }
  h1 {
    text-align: center;
    margin: 15px 0 30px;
    color: #000;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    max-width: 1000px;
    margin: 0 auto;
  }
  a {
    color: #000 !important;
  }
  a.on {
    color: #000 !important;
  }

  table td {
    border: 1px solid #ddd;
    padding: 5px 10px;
    font-size: 14px;
    vertical-align: middle;
  }
  table th {
    background: #666;
    color: #fff;
    font-weight: bold;
    border-top: 0;
    border: 1px solid #999;
    padding: 5px;
  }
  .box {
    border: 1px solid #ddd;
    padding: 20px;
    line-height: 1.4;
    background: #fff;
    max-width: 1000px;
    margin: 0 auto 30px;
    width: 100%;
  }
  .box span {
    text-align: right;
    display: block;
    margin-top: 10px;
  }

  @media (max-width: 600px) {
    body {
      padding: 0;
      display: block;
    }
    table {
      display: block;
      width: 100%;
    }
    table tr {
      display: block;
      padding-left: 20px;
      width: 100%;
      position: relative;
      border-bottom: 1px solid #ccc;
    }
    table thead {
      display: none;
    }
    /*table tbody {
      display: block;
      width: 100%;
    }*/
    table td {
      border: 0;
      display: inline-block;
      padding: 5px 0;
    }
    table td + td::before {
      content: " - ";
      display: inline-block;
      margin: 0 5px;
    }
    table td a {
      position: absolute;
      right: 20px;
      top: 5px;
    }
  }
</style>
