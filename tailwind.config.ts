import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                surface: "var(--surface)",
                secondarybg: "var(--secondary-bg)",
                primary: "var(--primary)",
                primaryhover: "var(--primary-hover)",
                textmain: "var(--text-main)",
                textsecondary: "var(--text-secondary)",
                border: "var(--border)",
                inputbg: "var(--input-bg)",
                link: "var(--link)",
            },
        },
    },
    plugins: [],
};

export default config;