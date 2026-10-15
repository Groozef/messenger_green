export interface Credentials {
    apiUrl: string;
    idInstance: string;
    apiTokenInstance: string;
}

export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed" | "noAccount";

export interface Message {
    id: string;
    text: string;
    timestamp: number;
    fromMe: boolean;
    status?: MessageStatus;
    error?: string;
    edited?: boolean;
    reactions?: {
        mine?: string;
        theirs?: string;
    };
}

export interface Chat {
    id: string;
    name: string;
    phone?: string;
    peerId?: string;
    messages: Message[];
    unread: number;
    createdAt: number;
}

export interface SenderData {
    chatId: string;
    chatName?: string;
    sender?: string;
    senderName?: string;
    senderContactName?: string;
    senderPhoneNumber?: number;
}

export interface MessageData {
    typeMessage: string;
    textMessageData?: {
        textMessage: string;
    };
    extendedTextMessageData?: {
        text: string;
    };
    deletedMessageData?: {
        stanzaId: string;
    };
    editedMessageData?: {
        textMessage: string;
        stanzaId: string;
    };
    quotedMessage?: {
        stanzaId: string;
    };
}

export interface MessageWebhook {
    typeWebhook: "incomingMessageReceived" | "outgoingMessageReceived" | "outgoingAPIMessageReceived";
    timestamp: number;
    idMessage: string;
    senderData: SenderData;
    messageData: MessageData;
}

export interface StatusWebhook {
    typeWebhook: "outgoingMessageStatus";
    chatId: string;
    idMessage: string;
    status: MessageStatus;
    description?: string;
}

export interface OtherWebhook {
    typeWebhook: string;
}

export type WebhookBody = MessageWebhook | StatusWebhook | OtherWebhook;

export interface Notification {
    receiptId: number;
    body: WebhookBody;
}
