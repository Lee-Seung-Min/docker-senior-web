export async function post({ request }) {
  const data = await request.json();
  console.log(data);

  return {
    body: data,
  };
}
