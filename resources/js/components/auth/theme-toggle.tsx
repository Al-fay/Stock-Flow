import { Moon, Sun, Monitor } from "lucide-react";
import { useAuthTheme } from "@/hooks/use-auth-theme";

export default function ThemeToggle() {
    const { theme, setTheme, mounted } = useAuthTheme();

    if (!mounted) {
        return (
            <div className="h-10 w-10 rounded-xl border border-border bg-card" />
        );
    }

    const options = [
        { value: "light", icon: Sun, label: "Light mode" },
        { value: "dark", icon: Moon, label: "Dark mode" },
        { value: "system", icon: Monitor, label: "System theme" },
    ] as const;

    return (
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
            {options.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    aria-label={label}
                    title={label}
                    aria-pressed={theme === value}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                        theme === value
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                    <Icon className="h-4 w-4" />
                </button>
            ))}
        </div>
    );
}
