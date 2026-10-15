import { useEffect, useEffectEvent, useState } from "react";
import { deleteNotification, receiveNotification } from "../services/greenApi";
import type { Credentials, WebhookBody } from "../types";

const RETRY_DELAY_MS = 5000;

const wait = (ms: number, signal: AbortSignal) =>
    new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        signal.addEventListener("abort", () => {
            clearTimeout(timer);
            resolve();
        });
    });

export const useNotifications = (credentials: Credentials, onNotification: (body: WebhookBody) => void) => {
    const [error, setError] = useState<string | null>(null);

    const handleNotification = useEffectEvent(onNotification);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const poll = async () => {
            while (!signal.aborted) {
                try {
                    const notification = await receiveNotification(credentials, signal);
                    setError(null);

                    if (!notification) continue;

                    try {
                        handleNotification(notification.body);
                    } finally {
                        await deleteNotification(credentials, notification.receiptId, signal);
                    }
                } catch (err) {
                    if (signal.aborted) return;

                    console.error("Ошибка получения уведомлений", err);
                    setError("Нет соединения с GREEN-API");
                    await wait(RETRY_DELAY_MS, signal);
                }
            }
        };

        poll();

        return () => controller.abort();
    }, [credentials]);

    return { error };
};
