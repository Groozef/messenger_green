import type { Chat, Credentials } from "../types";

const CREDENTIALS_KEY = "green_credentials";
const chatsKey = (idInstance: string) => `green_chats_${idInstance}`;

const read = <T>(key: string): T | null => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
};

const write = (key: string, value: unknown) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Не удалось сохранить данные", error);
    }
};

export const loadCredentials = () => read<Credentials>(CREDENTIALS_KEY);

export const saveCredentials = (credentials: Credentials) => write(CREDENTIALS_KEY, credentials);

export const clearCredentials = () => localStorage.removeItem(CREDENTIALS_KEY);

export const loadChats = (idInstance: string) => read<Chat[]>(chatsKey(idInstance)) ?? [];

export const saveChats = (idInstance: string, chats: Chat[]) => write(chatsKey(idInstance), chats);
