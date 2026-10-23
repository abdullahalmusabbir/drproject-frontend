"use client";

import { useEffect, useState } from "react";

export default function Footer() {
    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="w-full border-t border-border bg-surface">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-textsecondary sm:flex-row">
                <p>© {year ?? ""} DR Detect. All rights reserved.</p>
                <p>
                    Built for research purposes only —{" "}
                    <span className="text-link">not a medical diagnosis tool</span>.
                </p>
            </div>
        </footer>
    );
}