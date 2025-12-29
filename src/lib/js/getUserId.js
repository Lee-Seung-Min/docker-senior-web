import { json } from "@sveltejs/kit";
import { authUrlAddr } from "$lib/js/urlAddr";
import { getAPI } from "./getAPI";
import { isLogin } from "$lib/store/loginStore";
/**
 * @param jwt 사용자 정보를 가져오기 위한 jwt
 */
async function getUserId(jwt) {
  try {
    let id = "";
    await getAPI(authUrlAddr + "/v1/member/selectMemberInfo", jwt).then((result) => {
      if (result.message) {
        throw new Error(result.code);
      }
      isLogin?.update(() => true);
      id = result.mbrId;
    });
    return id;
  } catch (err) {
    console.log(err);
    isLogin?.update(() => false);
    throw err;
  }
}
export { getUserId };
