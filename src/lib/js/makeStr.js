//json 형태의 str로 만들어줌
export function makeStr(one, two) {
  let www = Object.assign(one, two);
  return JSON.stringify(www);
}
