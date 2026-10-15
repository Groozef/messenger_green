import { useCallback, useEffect, useReducer } from "react";
import { deleteMessage as deleteRemoteMessage, sendMessage } from "../services/greenApi";
import { loadChats, saveChats } from "../services/storage";
import type { Chat, Credentials, Message, MessageStatus, MessageWebhook, StatusWebhook, WebhookBody } from "../types";
import { chatsReducer, type ChatsState } from "./chatsReducer";

const MESSAGE_WEBHOOKS = ["incomingMessageReceived", "outgoingMessageReceived"];

const isMessageWebhook = (body: WebhookBody): body is MessageWebhook => MESSAGE_WEBHOOKS.includes(body.typeWebhook);

const isApiMessageWebhook = (body: WebhookBody): body is MessageWebhook =>
    body.typeWebhook === "outgoingAPIMessageReceived";

const isStatusWebhook = (body: WebhookBody): body is StatusWebhook => body.typeWebhook === "outgoingMessageStatus";

const LOCAL_ONLY_STATUSES: (MessageStatus | undefined)[] = ["pending", "failed", "noAccount"];

export const isLocalOnly = (message: Message) => LOCAL_ONLY_STATUSES.includes(message.status);

const initState = (idInstance: string): ChatsState => {
    const chats: Chat[] = loadChats(idInstance).map((chat) => ({
        ...chat,
        messages: chat.messages.map((message) =>
            message.status === "pending" ? { ...message, status: "failed" } : message,
        ),
    }));

    return { chats, activeChatId: null };
};

export const useChats = (credentials: Credentials) => {
    const [state, dispatch] = useReducer(chatsReducer, credentials.idInstance, initState);
    const { chats, activeChatId } = state;

    useEffect(() => {
        saveChats(credentials.idInstance, chats);
    }, [credentials.idInstance, chats]);

    const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

    const selectChat = useCallback((chatId: string) => {
        dispatch({ type: "chatSelected", chatId });
    }, []);

    const createChat = useCallback((phone: string, name: string) => {
        dispatch({ type: "chatCreated", phone, name, createdAt: Date.now() });
    }, []);

    const sendText = useCallback(
        async (chatId: string, text: string) => {
            const localId = crypto.randomUUID();

            dispatch({
                type: "messageAdded",
                chatId,
                message: { id: localId, text, timestamp: Date.now(), fromMe: true, status: "pending" },
            });

            try {
                const idMessage = await sendMessage(credentials, chatId, text);
                dispatch({ type: "messageSent", chatId, localId, idMessage });
            } catch (error) {
                console.error("Ошибка отправки сообщения", error);
                dispatch({ type: "messageFailed", chatId, localId });
            }
        },
        [credentials],
    );

    const handleWebhook = useCallback((body: WebhookBody) => {
        if (isMessageWebhook(body)) {
            dispatch({ type: "webhookMessage", webhook: body });
        } else if (isApiMessageWebhook(body)) {
            dispatch({ type: "peerResolved", idMessage: body.idMessage, peerId: body.senderData.chatId });
        } else if (isStatusWebhook(body)) {
            dispatch({ type: "statusUpdated", idMessage: body.idMessage, status: body.status, error: body.description });
            dispatch({ type: "peerResolved", idMessage: body.idMessage, peerId: body.chatId });
        }
    }, []);

    const deleteMessage = useCallback(
        async (chat: Chat, message: Message, forEveryone: boolean) => {
            if (!isLocalOnly(message)) {
                await deleteRemoteMessage(credentials, chat.peerId ?? chat.id, message.id, !forEveryone);
            }
            dispatch({ type: "messageDeleted", idMessage: message.id });
        },
        [credentials],
    );

    const deleteChat = useCallback((chatId: string) => {
        dispatch({ type: "chatDeleted", chatId });
    }, []);

    return { chats, activeChat, selectChat, createChat, sendText, deleteMessage, deleteChat, handleWebhook };
};
