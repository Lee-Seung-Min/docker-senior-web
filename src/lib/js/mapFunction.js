// @ts-nocheck

import { getDtl, getMap } from "./kakaoMap";
import { getGeoPermission } from "./phoneAction";
import { listUserLocation, mapUserLocation } from "$lib/store/userLocation";
//비트 컴퓨터 위치
// let lat = 37.4946012;
// let lon = 127.027561;

//남원시청 위치
let lat = 35.4164245;
let lon = 127.3904652;
export async function addMapScript(onLoadCallback) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=61293c54f9207fc7739fb7c9618d457c&autoload=false";
    document.head.appendChild(script);
    script.onload = () => {
        if (typeof onLoadCallback === "function") {
            onLoadCallback();
        }
    };
}

//상세페이지 맵
export async function makeDtlMap(lati, longi, shpType) {
    kakao.maps.load(() => {
        getDtl(lati, longi, shpType); //kakaoMap.js에 있는 지도 호출함수 실행
    });
}

//지도 만들기
export async function makeMap(lat, lon) {
    // kakao.maps.load(() => {
    //   getMap(lat, lon);
    // });
    try {
        await new Promise((resolve) => {
            kakao.maps.load(() => {
                resolve();
            });
        });

        getMap(lat, lon);
    } catch (error) {
        console.error("Error loading KakaoMap:", error);
    }
}

//현재 위치
export async function getCurrentPosition(onLoadCallback) {
    await navigator.geolocation.getCurrentPosition(
        (position) => {
            lat = position.coords.latitude;
            lon = position.coords.longitude;
            onLoadCallback(lat, lon);
        },
        (error) => {
            // // 권한이 거부된 경우 기본 위치로 설정
            // lat = 37.5665; // 예: 서울의 위도
            // lon = 126.978; // 예: 서울의 경도
            //남원시청 위치
            let lat = 35.4164245;
            let lon = 127.3904652;
            listUserLocation?.update(() => {
                return false;
            });
            mapUserLocation?.update(() => {
                return false;
            });
            onLoadCallback(lat, lon);
        }
    );
}

//현재 위치 찾은 후 지도 그리기
export async function currentHere() {
    if (typeof Android !== "undefined") {
        await getGeoPermission();
        window.receiveGeoPermission = (permission) => {
            if (permission) {
                getCurrentPosition((lat, lon) => {
                    mapUserLocation?.update(() => {
                        return true;
                    });
                    makeMap(lat, lon);
                });
            } else {
                // 권한이 거부된 경우 기본 위치로 설정
                // lat = 37.5665; // 예: 서울의 위도
                // lon = 126.978; // 예: 서울의 경도

                //남원시청 위치
                let lat = 35.4164245;
                let lon = 127.3904652;
                mapUserLocation?.update(() => {
                    return false;
                });
                makeMap(lat, lon);
            }
        };
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await getGeoPermission();
        window.receiveLocationPermissionFromIOS = (permission) => {
            if (permission == true) {
                getCurrentPosition((lat, lon) => {
                    mapUserLocation?.update(() => {
                        return true;
                    });
                    makeMap(lat, lon);
                });
            } else {
                // 권한이 거부된 경우 기본 위치로 설정
                // lat = 37.5665; // 예: 서울의 위도
                // lon = 126.978; // 예: 서울의 경도
                //남원시청 위치
                let lat = 35.4164245;
                let lon = 127.3904652;
                mapUserLocation?.update(() => {
                    return false;
                });
                makeMap(lat, lon);
            }
        };
    } else {
        getCurrentPosition((lat, lon) => {
            mapUserLocation?.update(() => {
                return true;
            });
            makeMap(lat, lon);
        });
        console.error("Android 인터페이스가 정의되지 않았습니다.");
    }
}
