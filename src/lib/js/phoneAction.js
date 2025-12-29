// @ts-nocheck
import { goto } from "$app/navigation";
import { makeStr } from "./makeStr";
import { postAPI } from "./postAPI";
import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";

export async function getGeoPermission() {
    if (typeof Android !== "undefined") {
        Android.getGeoloationPermission();
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // iOS에 위치 요청 메시지 전송
        window.webkit.messageHandlers.requestLocationPermission.postMessage(null);
    } else {
        console.error("Android 인터페이스가 정의되지 않았습니다.");
    }
}

export function getCall(telNumber) {
    if (typeof Android !== "undefined") {
        Android.get_Call_number(telNumber);
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // iOS에 전화 요청 메시지 전송
        window.webkit.messageHandlers.requestCallPermission.postMessage(telNumber);
        window.receiveCallPermissionFromIOS = (permission) => {};
    } else {
        console.error(telNumber + "Android 인터페이스가 정의되지 않았습니다.");
    }
}

export function goMap(link) {
    if (typeof Android !== "undefined") {
        Android.getMap(link);
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // iOS에 길찾기 이용
        window.webkit.messageHandlers.requestSafari.postMessage(link);
    } else {
        goto(link);
    }
}

export async function getDeviceToken(mbrId) {
    let fcmToken;
    let jwt = localStorage.getItem("userJwt");
    if (typeof Android !== "undefined") {
        // 콜백 함수로부터 FCM 토큰을 받아와서 처리
        window.receiveFCMToken = async (token) => {
            // FCM 토큰을 받았을 때 수행할 작업을 이 함수에서 구현

            // FCM 토큰을 변수에 할당
            fcmToken = token;
            let jsonStr = makeStr({ dvcToken: fcmToken, mbrId });
            const url = authUrlAddr + "/v1/member/saveDvcToken";
            let res = await postAPI(url, jsonStr, jwt);
        };
        // Android 인터페이스 사용 가능
        // Android.someFunction(); // 여기에서 Android 인터페이스의 함수 호출
        // 안드로이드에서 FCM 토큰을 요청하고 콜백 함수로 받아오기
        Android.getFCMToken("receiveFCMToken");
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // iOS의 WKWebView에서 FCM 토큰을 받기 위한 콜백 설정
        window.receiveFCMTokenFromIOS = async (token) => {
            // FCM 토큰을 받았을 때 수행할 작업을 이 함수에서 구현

            // FCM 토큰을 변수에 할당
            fcmToken = token;
            let jsonStr = makeStr({ dvcToken: fcmToken, mbrId });
            const url = authUrlAddr + "/v1/member/saveDvcToken";
            let res = await postAPI(url, jsonStr, jwt);
        };

        // iOS에 FCM 토큰 요청 메시지 전송
        window.webkit.messageHandlers.requestFCMToken.postMessage(null);
    } else {
        console.error("Android 인터페이스가 정의되지 않았습니다.");
    }
}

export async function getCamera(onLoadCallback) {
    if (typeof Android !== "undefined") {
        Android.getCameraPermission();
        window.receiveCamPermission = (permission) => {
            if (permission) {
                onLoadCallback(true);
            }
        };
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // iOS에 FCM 카메라 요청 메시지 전송
        window.webkit.messageHandlers.requestCameraPermission.postMessage(null);
        window.receiveCameraPermissionFromIOS = (permission) => {
            if (permission == true) {
                onLoadCallback(true);
            }
        };
    } else {
        onLoadCallback(true);
        console.error("Android 인터페이스가 정의되지 않았습니다.");
    }
}

export function getOsType() {
    if (typeof Android !== "undefined") {
        return "Android";
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        return "iOS";
    } else {
        return "etc";
    }
}
