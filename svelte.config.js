import adapter from "@sveltejs/adapter-static";
import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
// console.log('Loaded environment variables:', process.env);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html'   // SPA 라우팅이 필요하면 유지
    }),
    prerender: { entries: ['*'] }
  },
};

export default config;
