import type { Credentials, Notification } from "../types";

const RECEIVE_TIMEOUT_SEC = 20;

export class GreenApiError extends Error {
    readonly status: number;

    constructor(status: number) {
        super(`GREEN-API ответил ${status}`);
        this.status = status;
    }
}

export const getDefaultApiUrl = (idInstance: string) => `https://${idInstance.slice(0, 4)}.api.green-api.com`;

const buildUrl = ({ apiUrl, idInstance, apiTokenInstance }: Credentials, method: string) =>
    `${apiUrl.replace(/\/+$/, "")}/waInstance${idInstance}/${method}/${apiTokenInstance}`;

const request = async <T>(url: string, init?: RequestInit): Promise<T | null> => {
    const response = await fetch(url, init);

    if (!response.ok) {
        throw new GreenApiError(response.status);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
};

export const getStateInstance = async (credentials: Credentials) => {
    const data = await request<{ stateInstance: string }>(buildUrl(credentials, "getStateInstance"));
    return data?.stateInstance ?? "unknown";
};

export const sendMessage = async (credentials: Credentials, chatId: string, message: string) => {
    const data = await request<{ idMessage: string }>(buildUrl(credentials, "sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
    });

    if (!data?.idMessage) {
        throw new Error("Сообщение не принято сервером");
    }

    return data.idMessage;
};

export const deleteMessage = (credentials: Credentials, chatId: string, idMessage: string, onlySenderDelete: boolean) =>
    request(buildUrl(credentials, "deleteMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, idMessage, onlySenderDelete }),
    });

export const receiveNotification = (credentials: Credentials, signal: AbortSignal) =>
    request<Notification>(`${buildUrl(credentials, "receiveNotification")}?receiveTimeout=${RECEIVE_TIMEOUT_SEC}`, {
        signal,
    });

export const deleteNotification = (credentials: Credentials, receiptId: number, signal: AbortSignal) =>
    request<{ result: boolean }>(`${buildUrl(credentials, "deleteNotification")}/${receiptId}`, {
        method: "DELETE",
        signal,
    });
