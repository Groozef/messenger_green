import type { Chat, Message, MessageStatus, MessageWebhook } from "../types";
import { formatPhone, phoneToChatId } from "../utils/format";

export interface ChatsState {
    chats: Chat[];
    activeChatId: string | null;
}

export type ChatsAction =
    | { type: "chatCreated"; phone: string; name: string; createdAt: number }
    | { type: "chatSelected"; chatId: string }
    | { type: "messageAdded"; chatId: string; message: Message }
    | { type: "messageSent"; chatId: string; localId: string; idMessage: string }
    | { type: "messageFailed"; chatId: string; localId: string }
    | { type: "statusUpdated"; idMessage: string; status: MessageStatus; error?: string }
    | { type: "messageDeleted"; idMessage: string }
    | { type: "chatDeleted"; chatId: string }
    | { type: "peerResolved"; idMessage: string; peerId: string }
    | { type: "webhookMessage"; webhook: MessageWebhook };

const STATUS_ORDER: Record<MessageStatus, number> = {
    pending: 0,
    sent: 1,
    delivered: 2,
    read: 3,
    failed: 4,
    noAccount: 4,
};

const updateChat = (chats: Chat[], chatId: string, update: (chat: Chat) => Chat) =>
    chats.map((chat) => (chat.id === chatId ? update(chat) : chat));

const updateMessage = (chat: Chat, messageId: string, patch: Partial<Message>) => ({
    ...chat,
    messages: chat.messages.map((message) => (message.id === messageId ? { ...message, ...patch } : message)),
});

const TEXT_TYPES = ["textMessage", "extendedTextMessage"];

const extractText = ({ messageData }: MessageWebhook) => {
    if (!TEXT_TYPES.includes(messageData.typeMessage)) return undefined;
    return messageData.textMessageData?.textMessage ?? messageData.extendedTextMessageData?.text;
};

const extractPhone = ({ typeWebhook, senderData }: MessageWebhook) => {
    const isPrivateChat = senderData.chatId === senderData.sender;

    if (typeWebhook === "incomingMessageReceived" && isPrivateChat && senderData.senderPhoneNumber) {
        return String(senderData.senderPhoneNumber);
    }
    return senderData.chatId.endsWith("@c.us") ? senderData.chatId.split("@")[0] : undefined;
};

const isSamePeer = (chat: Chat, peerId: string) => chat.peerId === peerId || chat.id === peerId;

const findChat = (chats: Chat[], peerId: string, phone?: string) =>
    chats.find((chat) => isSamePeer(chat, peerId) || (phone && chat.phone === phone));

const mergeChats = (target: Chat, source: Chat): Chat => {
    const knownIds = new Set(target.messages.map((message) => message.id));
    const messages = [...target.messages, ...source.messages.filter((message) => !knownIds.has(message.id))];

    return {
        ...target,
        messages: messages.sort((a, b) => a.timestamp - b.timestamp),
        unread: target.unread + source.unread,
        createdAt: Math.min(target.createdAt, source.createdAt),
    };
};

const resolvePeer = (state: ChatsState, idMessage: string, peerId: string): ChatsState => {
    const target = state.chats.find((chat) => chat.messages.some((message) => message.id === idMessage));
    if (!target || target.peerId === peerId) return state;

    const duplicate = state.chats.find((chat) => chat.id !== target.id && isSamePeer(chat, peerId));
    const resolved = { ...target, peerId };
    const merged = duplicate ? mergeChats(resolved, duplicate) : resolved;
    const isActive = state.activeChatId === target.id || state.activeChatId === duplicate?.id;

    if (isActive) merged.unread = 0;

    return {
        activeChatId: isActive ? target.id : state.activeChatId,
        chats: state.chats
            .filter((chat) => chat.id !== duplicate?.id)
            .map((chat) => (chat.id === target.id ? merged : chat)),
    };
};

const patchMessage = (state: ChatsState, idMessage: string, patch: (message: Message) => Partial<Message>) => ({
    ...state,
    chats: state.chats.map((chat) =>
        chat.messages.some((message) => message.id === idMessage)
            ? {
                  ...chat,
                  messages: chat.messages.map((message) =>
                      message.id === idMessage ? { ...message, ...patch(message) } : message,
                  ),
              }
            : chat,
    ),
});

const removeMessage = (state: ChatsState, idMessage: string): ChatsState => ({
    ...state,
    chats: state.chats.map((chat) =>
        chat.messages.some((message) => message.id === idMessage)
            ? { ...chat, messages: chat.messages.filter((message) => message.id !== idMessage) }
            : chat,
    ),
});

const applyStatus = (chat: Chat, idMessage: string, status: MessageStatus, error?: string) => {
    const message = chat.messages.find((item) => item.id === idMessage);
    if (!message) return chat;

    const current = STATUS_ORDER[message.status ?? "sent"];
    if (STATUS_ORDER[status] <= current) return chat;

    return updateMessage(chat, idMessage, { status, error });
};

const applyWebhookMessage = (state: ChatsState, webhook: MessageWebhook): ChatsState => {
    const { messageData } = webhook;
    const fromMe = webhook.typeWebhook !== "incomingMessageReceived";

    if (messageData.deletedMessageData) {
        return removeMessage(state, messageData.deletedMessageData.stanzaId);
    }

    if (messageData.editedMessageData) {
        const { stanzaId, textMessage } = messageData.editedMessageData;
        return patchMessage(state, stanzaId, () => ({ text: textMessage, edited: true }));
    }

    if (messageData.typeMessage === "reactionMessage" && messageData.quotedMessage) {
        const emoji = messageData.extendedTextMessageData?.text || undefined;
        const side = fromMe ? "mine" : "theirs";
        return patchMessage(state, messageData.quotedMessage.stanzaId, (message) => ({
            reactions: { ...message.reactions, [side]: emoji },
        }));
    }

    const text = extractText(webhook);
    if (!text) return state;

    const { senderData, idMessage } = webhook;
    const phone = extractPhone(webhook);
    const existing = findChat(state.chats, senderData.chatId, phone);

    if (existing?.messages.some((message) => message.id === idMessage)) return state;

    const message: Message = {
        id: idMessage,
        text,
        timestamp: webhook.timestamp * 1000,
        fromMe,
        status: fromMe ? "sent" : undefined,
    };

    const isActive = existing?.id === state.activeChatId;
    const unreadDelta = fromMe || isActive ? 0 : 1;

    if (existing) {
        return {
            ...state,
            chats: updateChat(state.chats, existing.id, (chat) => ({
                ...chat,
                peerId: senderData.chatId,
                messages: [...chat.messages, message],
                unread: chat.unread + unreadDelta,
            })),
        };
    }

    const name = fromMe
        ? senderData.chatName
        : senderData.senderContactName || senderData.senderName || senderData.chatName;

    const chat: Chat = {
        id: phone ? phoneToChatId(phone) : senderData.chatId,
        name: name || (phone ? formatPhone(phone) : senderData.chatId),
        phone,
        peerId: senderData.chatId,
        messages: [message],
        unread: unreadDelta,
        createdAt: message.timestamp,
    };

    return { ...state, chats: [chat, ...state.chats] };
};

export const chatsReducer = (state: ChatsState, action: ChatsAction): ChatsState => {
    switch (action.type) {
        case "chatCreated": {
            const chatId = phoneToChatId(action.phone);
            const existing = state.chats.find((chat) => chat.phone === action.phone);

            if (existing) {
                return { ...state, activeChatId: existing.id };
            }

            const chat: Chat = {
                id: chatId,
                name: action.name || formatPhone(action.phone),
                phone: action.phone,
                messages: [],
                unread: 0,
                createdAt: action.createdAt,
            };

            return { chats: [chat, ...state.chats], activeChatId: chatId };
        }

        case "chatSelected":
            return {
                activeChatId: action.chatId,
                chats: updateChat(state.chats, action.chatId, (chat) => ({ ...chat, unread: 0 })),
            };

        case "messageAdded":
            return {
                ...state,
                chats: updateChat(state.chats, action.chatId, (chat) => ({
                    ...chat,
                    messages: [...chat.messages, action.message],
                })),
            };

        case "messageSent":
            return {
                ...state,
                chats: updateChat(state.chats, action.chatId, (chat) =>
                    updateMessage(chat, action.localId, { id: action.idMessage, status: "sent" }),
                ),
            };

        case "messageFailed":
            return {
                ...state,
                chats: updateChat(state.chats, action.chatId, (chat) =>
                    updateMessage(chat, action.localId, { status: "failed" }),
                ),
            };

        case "statusUpdated":
            return {
                ...state,
                chats: state.chats.map((chat) => applyStatus(chat, action.idMessage, action.status, action.error)),
            };

        case "messageDeleted":
            return removeMessage(state, action.idMessage);

        case "chatDeleted":
            return {
                chats: state.chats.filter((chat) => chat.id !== action.chatId),
                activeChatId: state.activeChatId === action.chatId ? null : state.activeChatId,
            };

        case "peerResolved":
            return resolvePeer(state, action.idMessage, action.peerId);

        case "webhookMessage":
            return applyWebhookMessage(state, action.webhook);

        default:
            return state;
    }
};
