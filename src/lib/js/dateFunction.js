// @ts-nocheck
/*
날짜를 받아 어떤 요일인지 리턴
*/
export function getDow(dateInput) {
  let now = dateInput ? new Date(dateInput) : new Date();
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  let dow = week[now.getDay()];
  return dow;
}

//7일 이내 작성한것인지 판별
export function getNew(e) {
  let date = new Date();
  let sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(date.getDate() - 7);
  let notiDay = new Date(e);
  return notiDay >= sevenDaysAgo && notiDay <= date;
}

//YYYY-MM-DD HH:MM:SS 형식
export function chngDateTimeSecondsFormat(date) {
  return (
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2) +
    " " +
    ("0" + date.getHours()).slice(-2) +
    ":" +
    ("0" + date.getMinutes()).slice(-2) +
    ":" +
    ("0" + date.getSeconds()).slice(-2)
  );
}

//YYYY-MM-DD HH:MM 형식
export function chngDateHourFormat(date) {
  return (
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2) +
    " " +
    ("0" + date.getHours()).slice(-2) +
    ":" +
    ("0" + date.getMinutes()).slice(-2)
  );
}

//YYYY-MM-DD 형식
export function chngDateFormat(date) {
  return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
}

//HH:MM 형식
export function chngTimeFormat(date) {
  return date.toTimeString().slice(0, 5);
}

//어제 날짜 세팅
export function getYesterDay() {
  let today = new Date();
  today.setDate(today.getDate() - 1);
  return today;
}

//한달전 날짜 세팅
export function getMonthAgo() {
  let today = new Date();
  today.setMonth(today.getMonth() - 1);
  return today;
}

export function get3MonthAgo() {
  let today = new Date();
  today.setMonth(today.getMonth() - 3);
  return today;
}

//오늘 YYYY-MM-DD 형식
export function getCurrentDay() {
  let today = new Date();
  return chngDateFormat(today);
}

//오늘 HH:mm 형식
export function getCurrentTime() {
  let currentDateTime = new Date();
  let currentTime = chngTimeFormat(currentDateTime);
  return currentTime;
}

//오늘 이후 날짜 선택x
export function getMaxDate() {
  const datepicker = document.getElementById("wrtDate");

  // 현재 날짜 가져오기
  const currentDate = new Date();

  // datepicker의 최대 날짜를 현재 날짜로 설정
  datepicker.setAttribute("max", chngDateFormat(currentDate));
}

// ios YYYY-MM-DD로 변환 2024-5-31 -> 2024-05-31
export function getIosDay(year, month, day) {
  return year + "-" + ("0" + month).slice(-2) + "-" + ("0" + day).slice(-2);
}

export function getSecretNumFirstFormat(date) {
  const [year, month, day] = date.split("-");
  return `${year.slice(2)}${month}${day}`;
}

// YYYY-MM-DD -> YY-MM-DD
export function toYYMMDD(dateStr) {
  if (!dateStr) return dateStr;

  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;

  // 이미 yy-mm-dd면 그대로
  if (y.length === 2) return `${y}-${m}-${d}`;

  // yyyy-mm-dd면 yy-mm-dd
  return `${y.slice(-2)}-${m}-${d}`;
}
