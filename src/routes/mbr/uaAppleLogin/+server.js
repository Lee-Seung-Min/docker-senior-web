import { redirect } from "@sveltejs/kit";

export async function POST({ request }) {
  console.log(request);
  throw redirect(301, "mbr/uaAppleLoginCallback");
}
