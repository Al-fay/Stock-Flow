import type { ReactNode } from "react";
import ThemeToggle from "./theme-toggle";
import { Link } from "@inertiajs/react";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
    footer?: ReactNode;
}

export default function AuthLayout({
    children,
    title,
    description,
    footer,
}: AuthLayoutProps) {
    return (
        <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground transition-colors duration-300">
            <div className="absolute right-5 top-5">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link
                        href="/sign-in"
                        className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground"
                    >
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            S
                        </span>
                        StockFlow
                    </Link>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Smart inventory management
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/5 sm:p-8">
                    <div className="mb-7">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {title}
                        </h1>

                        <p className="mt-2 text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    {children}
                </div>

                {footer && (
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        {footer}
                    </div>
                )}

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} StockFlow. All rights reserved.
                </p>
            </div>
        </main>
    );
}
