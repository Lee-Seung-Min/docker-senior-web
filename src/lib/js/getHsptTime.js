// @ts-nocheck
import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
import { getAPI } from "$lib/js/getAPI";
import { getCurrentDay } from "./dateFunction";
let timeData = { vacation: false, U: false, V: false, W: false, R: false };
//병원 당일 휴무여부 구하기
export async function getHsptTime(hsptShpId, setDgnsType) {
  let dow = new Date();
  const url = shopUrlAddr + "/v1/Shop/selectHsptHday?htmeHsptId=" + hsptShpId + "&dtmeDay=" + getCurrentDay();
  let resData = await getAPI(url);
  timeData.vacation = resData.resultVO.vacation;
  const dgnsUrl =
    shopUrlAddr +
    "/v1/Shop/selectHsptDgnsMobile?htmeHsptId=" +
    hsptShpId +
    "&htmeDay=" +
    dow.getDay() +
    "&dtmeType=" +
    setDgnsType +
    "&dtmeTime=" +
    dow.getHours() +
    ":" +
    dow.getMinutes();
  let dgnsTimeData = await getAPI(dgnsUrl);
  timeData.U = dgnsTimeData.resultVO.U;
  timeData.V = dgnsTimeData.resultVO.V;
  return timeData;
}
