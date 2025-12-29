// @ts-nocheck
import { getAPI } from "./getAPI";
import { shopUrlAddr } from "./urlAddr";
let hsptType = { ctlsDgns: false, ctlsRsv: false, vstDgns: false, vstRsv: false, ctls: false, visit: false };
let ctls = false;
//접수/예약 가능한 타입 구하기
export async function getHsptType(hsptShpId) {
  const url = shopUrlAddr + "/v1/Shop/selectHsptDgnsType?shpId=" + hsptShpId;
  let resData = await getAPI(url);
  let type = resData.resultVO;
  hsptType.ctls = false;
  hsptType.visit = false;
  if (type.shpWlkYon == "Y") {
    if (type.shpCtlsYon == "Y") {
      hsptType.ctlsDgns = true;
      hsptType.ctls = true;
    } else {
      hsptType.ctlsDgns = false;
    }
    if (type.shpVstYon == "Y") {
      hsptType.vstDgns = true;
      hsptType.visit = true;
    } else {
      hsptType.vstDgns = false;
    }
  } else {
    hsptType.ctlsDgns = false;
    hsptType.vstDgns = false;
  }
  if (type.shpRsvYon == "Y") {
    if (type.shpCtlsYon == "Y") {
      hsptType.ctlsRsv = true;
      hsptType.ctls = true;
    } else {
      hsptType.ctlsRsv = false;
    }
    if (type.shpVstYon == "Y") {
      hsptType.vstRsv = true;
      hsptType.visit = true;
    } else {
      hsptType.vstRsv = false;
    }
  } else {
    hsptType.ctlsRsv = false;
    hsptType.vstRsv = false;
  }
  ctls = hsptType.ctls;
  return { hsptType, ctls };
}
