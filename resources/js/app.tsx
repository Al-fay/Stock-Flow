import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import type { ComponentType } from "react";

const pages = import.meta.glob<{
    default: ComponentType<any>;
}>("./pages/**/*.tsx");

createInertiaApp({
    title: (title) => `${title} - Stock Flow`,

    resolve: async (name) => {
        const path = `./pages/${name}.tsx`;
        const page = pages[path];

        if (!page) {
            throw new Error(`Page not found: ${path}`);
        }

        const module = await page();

        return module.default;
    },

    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },

    progress: {
        color: "#635BFF",
    },
});
