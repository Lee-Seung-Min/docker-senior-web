// @ts-nocheck
import { writable } from "svelte/store";
import { getAPI } from "./getAPI";
import { postAPI } from "./postAPI";
import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
import { dgnsType } from "$lib/store/rgstStore.js";
import { searchType, searchData, searchWhat, location, firstLocation, secondLocation } from "$lib/store/search";
import { makeStr } from "./makeStr";
import { getOsType } from "./phoneAction";
import { chngDateTimeSecondsFormat } from "./dateFunction";
import { mapUserLocation } from "$lib/store/userLocation";
import { encrypt, getEncryptItems } from "./aes256";
// @ts-ignore
var map;
var dtlMap;
var watchId;
var marker = null;
var preLon;
var preLat;
var currentMapType = "";
var delMarkers = [];
const movementThreshold = 0.0001; // 이동 기준값 설정 (임의로 조정 가능)
export let popUpShp = writable(false);
export let popData = writable([]);
export let mapType = writable("");

// 데이터 정규화 제거: 각 호출부에서 원본 스키마를 그대로 popData에 전달합니다.

//기본 맵 그리기
export function getMap(lat, lon) {
    preLat = lat;
    preLon = lon;

    var container = document.getElementById("map");
    var options = {
        center: new kakao.maps.LatLng(lat, lon),
        level: 1,
    };
    map = new kakao.maps.Map(container, options);
    map.setMaxLevel(3);
    document.getElementById("map");

    // 맵 배경 클릭 시 팝업 닫기 (마커 클릭과 구분되어 동작)
    kakao.maps.event.addListener(map, "click", function () {
        popUpShp.set(false);
    });

    var bounds = map.getBounds();
    markerHere(lat, lon);
    currentMapType = "";
    makeMarker(bounds.ha, bounds.oa, bounds.qa, bounds.pa, lat, lon);

    // kakao.maps.event.addListener(map, "dragend", chngMap); //드레그 이벤트 추가
    // kakao.maps.event.addListener(map, "zoom_changed", chngMap); //이동 이벤트 추가
    // // 위치 추적 시작
    // navigator.geolocation.watchPosition(
    //   handleLocationUpdate,
    //   (error) => {
    //     console.error("Error getting geolocation:", error);
    //   },
    //   {
    //     enableHighAccuracy: true,
    //     timeout: 5000,
    //     maximumAge: 0,
    //   }
    // );
}

//병원dtl 맵 그리기
export function getDtl(lat, lon, type) {
    preLat = lat;
    preLon = lon;
    var container = document.getElementById("map");
    var options = {
        center: new kakao.maps.LatLng(lat, lon),
        level: 1,
    };
    dtlMap = new kakao.maps.Map(container, options);
    dtlMap.setMaxLevel(3);
    hsptDtlmarker(lat, lon, type);
    dtlMap.setDraggable(false);
    dtlMap.setZoomable(false);
}

// 위치 추적 기능
const handleLocationUpdate = (position) => {
    let newLat = position.coords.latitude;
    let newLon = position.coords.longitude;
    // 이동 거리 계산
    const distance = getDistance(preLat, preLon, newLat, newLon);
    if (distance >= movementThreshold) {
        // 기존 마커가 있다면 제거
        if (marker) {
            marker.setMap(null);
        }
        // // 중심 좌표 업데이트
        // const center = new kakao.maps.LatLng(newLat, newLon);
        // map.setCenter(center);

        // 마커 위치 업데이트
        markerHere(newLat, newLon);
        preLat = newLat;
        preLon = newLon;
    }
};
//병원 dtl 마커
export function hsptDtlmarker(lat, lon, type) {
    //const imgUrl = new URL("$lib/img/sample.png", import.meta.url).href;
    if (type == "hspt") {
        var imageSrc = new URL("$lib/img/barodoctor/hospital_4.png", import.meta.url).href,
            imageSize = new kakao.maps.Size(30, 30),
            imageOption = { offset: new kakao.maps.Point(10, 10) };
    } else if (type == "drst") {
        var imageSrc = new URL("$lib/img/barodoctor/hospital_5.png", import.meta.url).href,
            imageSize = new kakao.maps.Size(25, 25),
            imageOption = { offset: new kakao.maps.Point(10, 10) };
    }

    var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption),
        markerPosition = new kakao.maps.LatLng(lat, lon); // 마커 위치 조정

    marker = new kakao.maps.Marker({
        position: markerPosition,
        image: markerImage,
    });
    marker.setMap(dtlMap);
}

// 두 점 사이의 거리 계산 함수
const getDistance = (lat1, lon1, lat2, lon2) => {
    const radLat1 = (Math.PI * lat1) / 180;
    const radLat2 = (Math.PI * lat2) / 180;
    const theta = lon1 - lon2;
    const radTheta = (Math.PI * theta) / 180;
    let dist = Math.sin(radLat1) * Math.sin(radLat2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);
    if (dist > 1) {
        dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344; // 단위 변환 (마일을 킬로미터로)
    return dist;
};

//현재 위치 마커
export function markerHere(lat, lon) {
    //const imgUrl = new URL("$lib/img/sample.png", import.meta.url).href;
    var imageSrc = new URL("$lib/img/barodoctor/hospital_6.png", import.meta.url).href,
        imageSize = new kakao.maps.Size(30, 30),
        imageOption = { offset: new kakao.maps.Point(10, 10) };

    var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption),
        markerPosition = new kakao.maps.LatLng(lat, lon); // 마커 위치 조정

    marker = new kakao.maps.Marker({
        position: markerPosition,
        image: markerImage,
    });
    marker.setMap(map);
}

//병원/약국 위치 마커
export async function makeMarker(shpLongiFrom, shpLongiTo, shpLatiFrom, shpLatiTo, lat, lon) {
    mapType.subscribe((value) => {
        if (value != currentMapType) {
            currentMapType = value;
            if (currentMapType == "pspnPha") {
                markerPspn(shpLongiFrom, shpLongiTo, shpLatiFrom, shpLatiTo, lat, lon);
            } else if (currentMapType == "hspt") {
                markerHos(shpLongiFrom, shpLongiTo, shpLatiFrom, shpLatiTo);
            } else if (currentMapType == "pha") {
                markerDrg(shpLongiFrom, shpLongiTo, shpLatiFrom, shpLatiTo);
            }
        }
    });
}
//병원 위치 마커
async function markerHos(shpLongiFrom, shpLongiTo, shpLatiFrom, shpLatiTo) {
    var markList = [];
    var url = "";
    var source = "";
    var imageSrc = "";
    var imageSize = "";
    var imageOption = "";
    //병원 검색
    let date = new Date();
    let type = "";
    // @ts-ignore
    // dgnsType.subscribe((value) => {
    //   if (value == "V") {
    //     type = "V";
    //   } else if (value == "U") {
    //     type = "U";
    //   } else {
    //     type = "";
    //   }
    // });
    let srchWh;
    let srchDt;
    searchData?.subscribe((value) => {
        srchDt = value;
    });
    searchWhat?.subscribe((value) => {
        srchWh = value;
    });
    let jsonStr;
    mapUserLocation?.subscribe((value) => {
        if (value) {
            let encryptItems = getEncryptItems();
            jsonStr = makeStr({
                encShpLongiFrom: encrypt(shpLongiFrom, encryptItems),
                encShpLongiTo: encrypt(shpLongiTo, encryptItems),
                encShpLatiFrom: encrypt(shpLatiFrom, encryptItems),
                encShpLatiTo: encrypt(shpLatiTo, encryptItems),
                shpDay: date.getDay(),
                searchWhat: srchWh,
                searchData: srchDt,
                locOs: getOsType(),
                locUseDttm: chngDateTimeSecondsFormat(new Date()),
                locUse: true,
            });
        } else {
            jsonStr = makeStr({
                shpLongiFrom,
                shpLongiTo,
                shpLatiFrom,
                shpLatiTo,
                shpDay: date.getDay(),
                searchWhat: srchWh,
                searchData: srchDt,
                locOs: getOsType(),
                locUseDttm: chngDateTimeSecondsFormat(new Date()),
                locUse: false,
            });
        }
    });
    url =
        /*urlAddr +
      "8080*/ shopUrlAddr + "/v1/Shop/selectHsptListMobileNew";

    var res = await postAPI(url, jsonStr);
    markList = res.resultVO;
    let markersMap = new Map();
    for (let mark of markList) {
        var source;
        // 좌표를 문자열로 변환하여 키로 사용
        let coordinateKey = mark.shpLati + "," + mark.shpLongi;
        // coordinateKey에 해당하는 기존 마커 리스트를 가져옵니다.
        let existingMarks = markersMap.get(coordinateKey) || [];

        // 이미 존재하는 마커 중에 shpYon이 'Y'인 마커가 있는지 확인합니다.
        let hasMarkWithY = existingMarks.some((existingMark) => existingMark.shpYon === "Y");

        if (mark.shpYon == "Y" || hasMarkWithY) {
            source = new URL("$lib/img/barodoctor/hospital_4.png", import.meta.url).href;
        } else {
            source = new URL("$lib/img/barodoctor/hospital_g4.png", import.meta.url).href;
        }
        (imageSrc = source),
            (imageSize = new kakao.maps.Size(40, 40)),
            (imageOption = { offset: new kakao.maps.Point(10, 40) });
        var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption),
            markerPosition = new kakao.maps.LatLng(mark.shpLati, mark.shpLongi); // 마커 위치 조정
        let tit = mark.shpId;
        var marker = new kakao.maps.Marker({
            image: markerImage,
            map: map,
            position: markerPosition,
            title: tit,
            clickable: true,
        });
        delMarkers.push(marker);
        if (!markersMap.has(coordinateKey)) {
            markersMap.set(coordinateKey, []);
        }
        // 해당 좌표 키에 마커 정보 추가
        markersMap.get(coordinateKey).push(mark);
        kakao.maps.event.addListener(marker, "click", function () {
            let data = mark;
            popData.update(() => {
                return markersMap.get(coordinateKey);
            });
            popUpShp.update(() => {
                return true;
            });
        });
    }
}
//약국 위치 마커
async function markerDrg(shpLongiFrom, shpLongiTo, shpLatiFrom, shpLatiTo) {
    var markList = [];
    var url = "";
    var source = "";
    var imageSrc = "";
    var imageSize = "";
    var imageOption = "";
    //약국 검색
    let date = new Date();
    let srchDt;
    searchData?.subscribe((value) => {
        srchDt = value;
    });
    let jsonStr;
    mapUserLocation?.subscribe((value) => {
        if (value) {
            let encryptItems = getEncryptItems();
            jsonStr = makeStr({
                encShpLongiFrom: encrypt(shpLongiFrom, encryptItems),
                encShpLongiTo: encrypt(shpLongiTo, encryptItems),
                encShpLatiFrom: encrypt(shpLatiFrom, encryptItems),
                encShpLatiTo: encrypt(shpLatiTo, encryptItems),
                shpDay: date.getDay(),
                shpName: srchDt,
                locOs: getOsType(),
                locUseDttm: chngDateTimeSecondsFormat(new Date()),
                locUse: true,
            });
        } else {
            jsonStr = makeStr({
                shpLongiFrom,
                shpLongiTo,
                shpLatiFrom,
                shpLatiTo,
                shpDay: date.getDay(),
                shpName: srchDt,
                locOs: getOsType(),
                locUseDttm: chngDateTimeSecondsFormat(new Date()),
                locUse: false,
            });
        }
    });
    url =
        /*urlAddr +
    "8080*/ shopUrlAddr + "/v1/Shop/selectDrugStoreListMobileNew";

    var res = await postAPI(url, jsonStr);
    markList = res.resultVO;
    console.log("markerDrg : ", res.resultVO);
    for (let mark of markList) {
        var source;
        if (mark.shpYon == "Y") {
            source = new URL("$lib/img/barodoctor/hospital_5.png", import.meta.url).href;
        } else {
            source = new URL("$lib/img/barodoctor/hospital_g5.png", import.meta.url).href;
        }
        (imageSrc = source),
            (imageSize = new kakao.maps.Size(25, 25)),
            (imageOption = { offset: new kakao.maps.Point(10, 10) });
        var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption),
            markerPosition = new kakao.maps.LatLng(mark.shpLati, mark.shpLongi); // 마커 위치 조정
        let tit = mark.shpId;
        var marker = new kakao.maps.Marker({
            image: markerImage,
            map: map,
            position: markerPosition,
            title: tit,
            clickable: true,
        });
        delMarkers.push(marker);
        kakao.maps.event.addListener(marker, "click", function () {
            // 정규화 없이 원본 데이터를 그대로 전달
            popData.update(() => [mark]);
            popUpShp.update(() => {
                return true;
            });
        });
    }
}
//처방전 발급 가능 약국 마커
async function markerPspn(shpLongiFrom, shpLongiTo, shpLatiFrom, shpLatiTo, lat, lon) {
    var markList = [];
    var url = "";
    var source = "";
    var imageSrc = "";
    var imageSize = "";
    var imageOption = "";
    let srchDt;

    searchData?.subscribe((value) => {
        srchDt = value;
    });
    var distance = calculateDistance(shpLatiFrom, shpLongiFrom, lat, lon);
    distance = Math.round(distance);
    let jsonStr;
    mapUserLocation?.subscribe((value) => {
        if (value) {
            let encryptItems = getEncryptItems();
            jsonStr = makeStr({
                encCoordinateY: encrypt(lat, encryptItems),
                encCoordinateX: encrypt(lon, encryptItems),
                encDistance: encrypt(distance, encryptItems),
                locOs: getOsType(),
                locUseDttm: chngDateTimeSecondsFormat(new Date()),
                locUse: true,
            });
        } else {
            jsonStr = makeStr({
                coordinateY: lat,
                coordinateX: lon,
                distance,
                locOs: getOsType(),
                locUseDttm: chngDateTimeSecondsFormat(new Date()),
                locUse: false,
            });
        }
    });
    //처방전 약국 표시
    url =
        // /*urlAddr +
        // "8080*/ shopUrlAddr +
        // "/v1/Shop/selectPspnDrugStoreListMobile?shpLongiFrom=" +
        // shpLongiFrom +
        // "&shpLongiTo=" +
        // shpLongiTo +
        // "&shpLatiFrom=" +
        // shpLatiFrom +
        // "&shpLatiTo=" +
        // shpLatiTo +
        // "&shpName=" +
        // srchDt;
        shopUrlAddr + "/v1/ppds/getPharmacyList";
    var res = await postAPI(url, jsonStr);
    markList = res.resultVO;
    console.log("marketList response : ", res);
    let markersMap = new Map();
    for (let mark of markList) {
        var source;
        // 좌표를 문자열로 변환하여 키로 사용
        let coordinateKey = mark.coordinateX + "," + mark.coordinateY;
        // coordinateKey에 해당하는 기존 마커 리스트를 가져옵니다.
        let existingMarks = markersMap.get(coordinateKey) || [];

        // 이미 존재하는 마커 중에 shpYon이 'Y'인 마커가 있는지 확인합니다.
        let hasMarkWithY = existingMarks.some((existingMark) => existingMark.enableYn === "Y");
        if (mark.enableYn == "Y" || hasMarkWithY) {
            source = new URL("$lib/img/barodoctor/hospital_5.png", import.meta.url).href;
            (imageSrc = source),
                (imageSize = new kakao.maps.Size(35, 35)),
                (imageOption = { offset: new kakao.maps.Point(10, 10) });
        } else {
            source = new URL("$lib/img/barodoctor/hospital_g5.png", import.meta.url).href;
            (imageSrc = source),
                (imageSize = new kakao.maps.Size(25, 25)),
                (imageOption = { offset: new kakao.maps.Point(10, 10) });
        }

        var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption),
            markerPosition = new kakao.maps.LatLng(mark.coordinateX, mark.coordinateY); // 마커 위치 조정
        let tit = mark.pharmacyCode;
        var marker = new kakao.maps.Marker({
            image: markerImage,
            map: map,
            position: markerPosition,
            title: tit,
            clickable: true,
        });
        if (!markersMap.has(coordinateKey)) {
            markersMap.set(coordinateKey, []);
        }
        // 해당 좌표 키에 마커 정보 추가
        markersMap.get(coordinateKey).push(mark);
        delMarkers.push(marker);
        kakao.maps.event.addListener(marker, "click", function () {
            popData.update(() => {
                return markersMap.get(coordinateKey);
            });
            popUpShp.update(() => {
                return true;
            });
        });
    }
}
// 지도 변경시 범위에 따라 마커 다시 그리기
export async function chngMap() {
    for (let delMarker of delMarkers) {
        delMarker.setMap(null);
    }
    // 누적 참조 제거
    delMarkers.length = 0;
    currentMapType = "";
    var bounds = map.getBounds();
    var center = map.getCenter();
    makeMarker(bounds.ha, bounds.oa, bounds.qa, bounds.pa, center.Ma, center.La);
}

//주소 동 위치 구하기
export async function alterAddr(lat, lon) {
    if (lat && lon) {
        const url = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=" + lon + "&y=" + lat;
        const res = await fetch(url, {
            method: "GET",
            headers: { Authorization: "KakaoAK b87e5db988c66a858cfc810a5269b706" },
        });
        let resData = await res.json();
        location?.update(() => {
            return resData.documents[0].region_3depth_name;
        });
        firstLocation?.update(() => {
            return resData.documents[0].region_1depth_name;
        });
        secondLocation?.update(() => {
            return resData.documents[0].region_2depth_name;
        });
    }
}

//지도 반경 계산
function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    var R = 6371e3; // 지구의 반경 (미터 단위)
    var φ1 = toRadians(lat1);
    var φ2 = toRadians(lat2);
    var Δφ = toRadians(lat2 - lat1);
    var Δλ = toRadians(lon2 - lon1);

    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 최종 거리
}
