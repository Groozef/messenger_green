interface ImportMetaEnv {
    readonly VITE_GREEN_API_URL?: string;
    readonly VITE_GREEN_API_ID_INSTANCE?: string;
    readonly VITE_GREEN_API_TOKEN?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
