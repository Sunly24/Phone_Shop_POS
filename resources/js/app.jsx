import "./bootstrap";

import React from "react"; // Add React import to fix JSX rendering

// Import jQuery and Bootstrap (Required for dropdowns)
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "@fortawesome/fontawesome-free/css/all.min.css";

// Import Tailwind CSS first
import "../css/app.css";

// Import AdminLTE last so it takes precedence
import "admin-lte/dist/css/adminlte.min.css";
import "admin-lte/dist/js/adminlte.min.js";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
// Import Redux Provider and your store
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";
import store, { persistor } from "./Pages/store/index";

// Import i18n configuration and language utilities
import "./i18n";

const appName = import.meta.env.VITE_APP_NAME || "ចង់បាន-JongBan Phone Store";

createInertiaApp({
    title: (title) => `${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <App {...props} />
                </PersistGate>
            </Provider>
        );
    },
    progress: {
        color: "#4B5563",
    },
});
