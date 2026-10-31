import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "inventory-theme";

export function useAuthTheme() {
    const [theme, setTheme] = useState<Theme>("system");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;

        if (
            savedTheme === "light" ||
            savedTheme === "dark" ||
            savedTheme === "system"
        ) {
            setTheme(savedTheme);
        }

        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const applyTheme = () => {
            const isDark =
                theme === "dark" || (theme === "system" && media.matches);

            root.classList.toggle("dark", isDark);
            root.style.colorScheme = isDark ? "dark" : "light";
        };

        applyTheme();

        if (theme === "system") {
            media.addEventListener("change", applyTheme);
        }

        localStorage.setItem(STORAGE_KEY, theme);

        return () => {
            media.removeEventListener("change", applyTheme);
        };
    }, [theme, mounted]);

    return { theme, setTheme, mounted };
}
