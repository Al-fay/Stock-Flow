import { useEffect } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

export function useAutoRefresh() {
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        let stopped = false;
        let refreshing = false;

        const refresh = async () => {
            if (refreshing || stopped) return;

            refreshing = true;

            try {
                const response = await fetch("/refresh-token", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        "X-CSRF-TOKEN":
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]',
                            )?.content ?? "",
                    },
                });

                if (response.status === 401) {
                    stopped = true;
                    router.visit("/");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Gagal memperbarui token");
                }
            } catch (error: any) {
                toast.error("Auto refresh gagal:", error);
            } finally {
                refreshing = false;
            }
        };

        const schedule = () => {
            clearTimeout(timer);

            timer = setTimeout(
                async () => {
                    await refresh();

                    if (!stopped) {
                        schedule();
                    }
                },
                14 * 60 * 1000,
            );
        };

        schedule();

        const handleVisibility = async () => {
            if (document.visibilityState === "visible") {
                await refresh();

                if (!stopped) {
                    schedule();
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            stopped = true;
            clearTimeout(timer);

            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);
}
