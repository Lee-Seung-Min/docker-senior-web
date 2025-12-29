// @ts-nocheck
import { shopUrlAddr, authUrlAddr, adminUrlAddr, mobileUrlAddr } from "$lib/js/urlAddr";
import { getAPI } from "$lib/js/getAPI";
let dtrList = [];

//진료과로 의사 찾기
export async function searchDtrByDept(dgnsShpId, dept, dgnsType) {
  const url =
    /*urlAddr +
        "8080*/ shopUrlAddr +
    "/v1/Shop/selectHospitalDoctorListMobile?shpId=" +
    dgnsShpId +
    "&shpItemId=0" +
    // item +
    "&shpDeptId=" +
    dept +
    "&dgnsType=" +
    dgnsType;
  let resData = await getAPI(url);
  dtrList = resData.resultVO;
  return dtrList;
}
