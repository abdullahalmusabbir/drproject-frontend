"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold">
                        DR
                    </div>
                    <span className="text-lg font-semibold text-textmain">
                        DR Detect
                    </span>
                </div>

                {mounted && (
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-full border border-border bg-secondarybg px-4 py-2 text-sm font-medium text-textmain transition hover:border-primary"
                    >
                        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
                    </button>
                )}
            </div>
        </nav>
    );
}