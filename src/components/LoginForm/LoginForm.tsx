import React, { useState } from "react";
import { getDefaultApiUrl, getStateInstance, GreenApiError } from "../../services/greenApi";
import type { Credentials } from "../../types";
import styles from "./LoginForm.module.css";

interface LoginFormProps {
    onLogin: (credentials: Credentials) => void;
}

const getErrorMessage = (error: unknown) => {
    if (error instanceof GreenApiError && [401, 403].includes(error.status)) {
        return "Неверный idInstance или apiTokenInstance";
    }
    if (error instanceof GreenApiError) {
        return `Ошибка сервера (${error.status}). Проверьте apiUrl`;
    }
    return "Не удалось подключиться. apiUrl должен быть вида https://XXXX.api.green-api.com";
};

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [form, setForm] = useState<Credentials>({
        apiUrl: import.meta.env.VITE_GREEN_API_URL ?? "",
        idInstance: import.meta.env.VITE_GREEN_API_ID_INSTANCE ?? "",
        apiTokenInstance: import.meta.env.VITE_GREEN_API_TOKEN ?? "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const idInstance = form.idInstance.trim();
        const apiTokenInstance = form.apiTokenInstance.trim();

        if (!idInstance || !apiTokenInstance) {
            setError("Заполните idInstance и apiTokenInstance");
            return;
        }

        const credentials: Credentials = {
            apiUrl: form.apiUrl.trim() || getDefaultApiUrl(idInstance),
            idInstance,
            apiTokenInstance,
        };

        setLoading(true);
        setError(null);

        try {
            const state = await getStateInstance(credentials);

            if (state !== "authorized") {
                setError(`Инстанс не авторизован (статус: ${state})`);
                return;
            }

            onLogin(credentials);
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <form className={styles.card} onSubmit={handleSubmit}>
                <div className={styles.logo}>
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                    </svg>
                </div>
                <h1 className={styles.title}>Вход через GREEN-API</h1>
                <p className={styles.subtitle}>Данные инстанса можно найти в личном кабинете GREEN-API</p>

                <label className={styles.field}>
                    <span className={styles.label}>idInstance</span>
                    <input
                        name="idInstance"
                        value={form.idInstance}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="4100000000"
                        autoFocus
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>apiTokenInstance</span>
                    <input
                        name="apiTokenInstance"
                        type="password"
                        value={form.apiTokenInstance}
                        onChange={handleChange}
                        className={styles.input}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>apiUrl</span>
                    <input
                        name="apiUrl"
                        value={form.apiUrl}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder={form.idInstance ? getDefaultApiUrl(form.idInstance.trim()) : "необязательно"}
                    />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.submit} disabled={loading}>
                    {loading ? "Проверяем..." : "Войти"}
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
