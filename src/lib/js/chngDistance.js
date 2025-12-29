// @ts-nocheck
//거리 m or km로 변환
export function chngDistance(e) {
  if (e.toString().includes(".")) {
    const dis = e.toString().split(".");
    if (dis[0] != "0") {
      return dis[0] + "." + dis[1].slice(0, 2) + "km";
    } else {
      return e * 1000 + "m";
    }
  } else {
    return e + "km";
  }
}
