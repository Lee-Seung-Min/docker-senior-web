import { sveltekit } from "@sveltejs/kit/vite";
import mkcert from "vite-plugin-mkcert";
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from "vite";
import dotenv from 'dotenv';
import fs from "fs";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
// console.log(`Loaded environment variables from .env.${process.env.NODE_ENV}:`, process.env);

export default defineConfig({
  plugins: [sveltekit(), mkcert(),basicSsl()],
  // plugins: [sveltekit(), ],
  define: {
    "process.env": process.env,
  },
  server: {
    port: process.env.VITE_PORT,
    // https: true,
    proxy: {
      '/admin': {
        target: 'https://122.199.226.254:8000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/admin/, ''),
        secure: false,
        ws: true
      },
      '/auth': {
        target: 'https://122.199.226.254:8000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/auth/, ''),
        secure: false,
        ws: true
      },
      '/shop': {
        target: 'https://122.199.226.254:8000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/shop/, ''),
        secure: false,
        ws: true
      },
      '/mobile': {
        target: 'https://122.199.226.254:8000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/mobile/, ''),
        secure: false,
        ws: true
      }
    }
  },
  // https: {
  //   key: fs.readFileSync("./cert.key"),
  //   cert: fs.readFileSync("./cert.crt"),
  // },
});
