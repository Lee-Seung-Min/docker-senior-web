$(function () {
  $(window).on("load", function () {
    //    $(".loading_box").delay(100).fadeOut();

    if ($("body").find("header").length > 0) {
      //  $("header").load("../../assets/inc/header.html",function(){
      if ($("body").hasClass("home")) {
        $("nav .home").addClass("on");
      } else if ($("body").hasClass("menu1")) {
        $("nav .menu1").addClass("on");
      } else if ($("body").hasClass("menu2")) {
        $("nav .menu2").addClass("on");
      } else if ($("body").hasClass("menu3")) {
        $("nav .menu3").addClass("on");
      } else if ($("body").hasClass("menu4")) {
        $("nav .menu4").addClass("on");
      }
      //  });
    }

    $(".z_alert .box_1").append('<button type="button" class="alert_close"><i class="xi-close-min"></i></button>');
    $(".alert_close").on("click", function () {
      $(this).parents().find(".z_alert").removeClass("show");
    });
  });

  //메인 구분
  if ($("main").length == 0) {
    $("body").addClass("sub");
    $("body").addClass("on");
  } else {
    $("body").addClass("on");
  }

  //link
  $("body").on("click", "button, .box_hos, .box_1, .durg", function () {
    var url = $(this).attr("data-url");
    if ((url !== "") & (url !== undefined)) {
      if (url.match("http")) {
        window.open(url, "_blank");
        e.preventDefault();
      } else {
        location.href = url;
        e.preventDefault();
      }
    }
  });

  //모든 삭제
  $("body").on("click", ".del_btn", function () {
    $(this).parents("[class^='box_']").remove();
    $("#del_btn").addClass("on");
  });

  //파일 추가
  $("#box_fileup").on("click", "input", function () {
    $(".file_box").append(
      "<div class='file_img'><button type='button' class='del'></button><img src='../img/ex_docu.jpg'></div>"
    );
  });

  //파일 삭제
  $("#box_fileup").on("click", ".del", function () {
    $(this).parents(".file_img").remove();
    //$("#del_btn").addClass("on");
  });

  //로고 클릭시 메인으로
  $("header").on("click", "h1", function () {
    location.href = "main.html";
  });

  //main 상단 슬라이드
  $(".slide_list").bxSlider({
    //controls: false
    auto: true,
    pager: true,
    controls: false,
    autoControls: false,
    speed: 1000,
    stopAutoOnClick: true,
    autoControlsCombine: true,
    touchEnabled: navigator.maxTouchPoints > 0,
  });

  //main list 아이콘 가로 크기
  var $main_list = $(".list_wrap");
  if ($(document).width() < 780 && 320 < $(document).width()) {
    var mainListWid = $main_list.eq(0).width() / 4;
    $main_list.find(".list button").css("min-width", mainListWid);
  }

  //list 클릭 이벤트
  $main_list.on("click", ".prve, .next", function () {
    var indexNo = $(this).parent(".list_wrap").index();
    var nowScrol = $main_list.eq(indexNo).find(".list").scrollLeft();
    var moveWid = $main_list.eq(indexNo).find(".list button").width();
    if ($(this).hasClass("prve")) {
      var moveScrol = nowScrol - moveWid;
    } else {
      var moveScrol = nowScrol + moveWid;
    }
    $main_list.eq(indexNo).find(".list").animate({ scrollLeft: moveScrol }, 400);
  });

  //2023.6.2 조장훈 input입력을 방해하는 함수여서 잠시 주석처리 하였습니다.
  //login 입력
  // $(".login").on("keypress keyup keydown", "input", function (e) {
  //   console.log(e.which);
  //   if (this.value.length >= this.maxLength) { //1자리 이상 입력되면 다음 input으로 이동시키기
  //     this.value = this.value.slice(0, this.maxLength);
  //     if ($(this).next("input").length > 0) {
  //       $(this).next().focus();
  //     } else {
  //       $(this).blur();
  //     }
  //   }
  // });

  //회원가입 전제 동의
  $(".join").on("click", "#more_link_all", function () {
    var checked = $("#more_link_all").is(":checked");
    if (checked) $(".join input:checkbox").prop("checked", true);
    if (!checked) $(".join input:checkbox").prop("checked", false);
  });

  //팝업창 닫기
  $(".full_layer").on("click", "#close, .close_btn, .bg", function () {
    $(".full_layer").removeClass("on");
  });

  //지역 선택 오픈
  $(".search").on("click", ".mbtn_map_7", function () {
    $("#selectMap").addClass("on");
  });

  //검색 날짜 선택 오픈
  $(".search").on("click", ".mbtn_data_0", function () {
    $("#selectData").addClass("on");
  });

  //진료예약 변경 날짜 선택 오픈
  $("body").on("click", ".dataSelect", function () {
    $("#selectData").addClass("on");
  });

  //로그아웃 오픈
  $("body").on("click", ".logout", function () {
    $("#logout").addClass("on");
  });

  //회원탈퇴 오픈
  $("body").on("click", ".peoLeave", function () {
    $("#peoLeave").addClass("on");
  });

  //결제안내 오픈
  $("body").on("click", ".prePayInfo", function () {
    $("#prePayInfo").addClass("on");
  });

  //예약취소
  $("body").on("click", ".mbtn_res_9", function () {
    $("#resCancel").addClass("on");
    e.preventDefault();
  });

  //검색창에서 pc 검색 버튼 숨기기
  if ($("section.search").length > 0) {
    $("header .info .search").remove();
  }

  //지도에서 병원, 약국 클릭시
  $("#map").on("click", "[class^='map_']", function () {
    $(".box_hos").addClass("on");
  });

  //지도에서 병원, 약국 외 클릭시
  $(".map_wrap").on("click", "#map", function () {
    if (!$(event.target).is("button")) {
      $(".box_hos").removeClass("on");
    }
  });

  //의료진 선택
  $(".onAction").on("click", "button", function () {
    $(this).parent(".onAction").find("button").removeClass("on");
    $(this).addClass("on");
  });

  //즐겨찾기
  // $("body").on("click", "[class^='mark_']", function () {
  //   var clas = $(this).attr("class");
  //   if (clas == "mark_off") {
  //     $("#bookMark .stay").text(" 추가");
  //     $(this).attr("class", "mark_on");
  //   } else if (clas == "mark_on") {
  //     $("#bookMark .stay").text("서 삭제");
  //     $(this).attr("class", "mark_off");
  //   }
  //   $("#bookMark").addClass("on");
  // });

  //모든 최근검색어 삭제
  $("body").on("click", "#search_all_del", function () {
    $("#search_list div").remove();
    $("#search_list").html("<p class='txt_c'>내역이 없습니다</p>");
    $(this).remove();
  });

  //모든 알람 삭제
  $("body").on("click", "#alarm_all_del", function () {
    $("#alarm_list div").remove();
    $("#alarm_list").html("<p class='txt_c'>내역이 없습니다</p>");
    $(this).remove();
  });

  //리뷰 별 선택
  $(".star_selet").on("click", "input", function () {
    $(".star_selet label input").prop("checked", false);
    var no = $(this).parent("label").index();
    $(".star_selet label").each(function (i) {
      if (no >= i) {
        $(this).find("input").prop("checked", true);
      }
    });
  });

  //리뷰 퍼센트 표기
  $(".bar_star").each(function (i) {
    var percent = $(this).attr("data-percent");
    var star = Math.floor(percent / 20);
    var pus = (16 * (percent - star * 20)) / 20;
    var wid = 21 * star + pus;
    $(this).find("span").css("width", wid);
  });

  //자주하는 질문
  $("#qna").on("click", ".box_1", function () {
    $("#qna .bg_gray").removeClass("on");
    $(this).find(".bg_gray").addClass("on");
  });

  //진단내용을 선택
  $(".mbtnBox.action").on("click", "button", function () {
    if ($(this).is(".mbtn_t")) {
      $(this).attr("class", "mbtn_b");
    } else {
      $(this).attr("class", "mbtn_t");
    }
  });

  //의료비 서류
  $boxDocuinfo = $(".box_docuinfo");
  $boxDocuinfo.on("click", ".info", function () {
    if ($boxDocuinfo.is(".on")) {
      $boxDocuinfo.removeClass("on");
    } else {
      $boxDocuinfo.addClass("on");
    }
  });

  //서류 샘플보기
  $(".box_docuinfo").on("click", ".mbtn_t", function () {
    var url = $(this).attr("data-img");
    var text = $(this).before("span").text();
    if ((url !== "") & (url !== undefined)) {
      $("#sample .tit").text(text);
      $("#sample img").attr("src", url);
      $("#sample").addClass("on");
    }
  });

  $.datepicker.regional["ko"] = {
    dateFormat: "yy-mm-dd", //달력 날짜 형태
    showOtherMonths: true, //빈 공간에 현재월의 앞뒤월의 날짜를 표시
    showMonthAfterYear: true, // 월- 년 순서가아닌 년도 - 월 순서
    changeYear: true, //option값 년 선택 가능
    changeMonth: true, //option값  월 선택 가능
    buttonImageOnly: true, //버튼 이미지만 깔끔하게 보이게함
    buttonText: "선택", //버튼 호버 텍스트
    yearSuffix: "년", //달력의 년도 부분 뒤 텍스트
    monthNamesShort: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"], //달력의 월 부분 텍스트
    monthNames: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"], //달력의 월 부분 Tooltip
    dayNamesMin: ["일", "월", "화", "수", "목", "금", "토"], //달력의 요일 텍스트
    dayNames: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"], //달력의 요일 Tooltip
    minDate: "0", //최소 선택일자(-1D:하루전, -1M:한달전, -1Y:일년전)
    maxDate: "+10y", //최대 선택일자(+1D:하루후, -1M:한달후, -1Y:일년후)
  };
  $.datepicker.setDefaults($.datepicker.regional["ko"]);

  $(".datepicker").datepicker();
  $(".datepicker.type2").datepicker("option", "minDate", "-10y");

  //키보드 활성화 할때 픽스 문제
  $("input").each(function () {
    $(this).bind("focus", function () {
      $("nav").css("position", "absolute");
    });
    $(this).bind("blur", function () {
      $("nav").css("position", "fixed");
    });
  });

  //병원정보 스크롤 이동
  $("#scrollMove").on("click", "button", function () {
    $("#scrollMove button").removeClass("on");
    $(this).addClass("on");
    var wid = $("body").width();
    var top = 110;
    if (wid >= 780) {
      top = 70;
    }
    var id = $(this).attr("data-id");
    var moScroll = $(id).offset().top - top;
    $("html, body").animate({ scrollTop: moScroll }, 1000);
  });
});

//기본확인창
function alt(txt, t) {
  event.stopImmediatePropagation();
  $("#alt .tex").text(txt);
  var url = $(t).attr("data-url");
  $("#alt #close").attr("data-url", url);
  $("#alt").addClass("on");
}
