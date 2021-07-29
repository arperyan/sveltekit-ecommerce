import preprocess from "svelte-preprocess";
import vercel from "@sveltejs/adapter-vercel";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://github.com/sveltejs/svelte-preprocess
    // for more information about preprocessors
    preprocess: preprocess(),

    kit: {
        // hydrate the <div id="svelte"> element in src/app.html
        target: "#svelte",
        adapter: vercel(),
        prerender: {
            pages: ["*"],
        },
        vite: {
            ssr: {
                noExternal: [
                    "@stitches/core",
                    "@urql/core",
                    "@urql/exchange-graphcache",
                    "@urql/exchange-multipart-fetch",
                    "@urql/svelte",
                    "svelte-seo",
                ],
            },
            optimizeDeps: {
                exclude: [
                    "@urql/svelte",
                    "@urql/exchange-multipart-fetch",

                    "@stitches/core",
                ],
                include: ["extract-files"],
            },
        },
    },
};

export default config;
