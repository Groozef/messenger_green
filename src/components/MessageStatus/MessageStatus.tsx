import type { Message, MessageStatus as Status } from "../../types";
import styles from "./MessageStatus.module.css";

const ICONS: Record<Status, string> = {
    pending: "🕓",
    sent: "✓",
    delivered: "✓✓",
    read: "✓✓",
    failed: "!",
    noAccount: "!",
};

const TITLES: Record<Status, string> = {
    pending: "Отправляется",
    sent: "Отправлено",
    delivered: "Доставлено",
    read: "Прочитано",
    failed: "Не отправлено",
    noAccount: "Номер не зарегистрирован в Telegram или скрыт настройками приватности",
};

interface MessageStatusProps {
    message: Message;
}

const MessageStatus = ({ message }: MessageStatusProps) => {
    if (!message.fromMe || !message.status) return null;

    const { status } = message;
    const isError = status === "failed" || status === "noAccount";
    const className = `${styles.status} ${styles[status] ?? ""} ${isError ? styles.error : ""}`;

    return (
        <span className={className} title={message.error || TITLES[status]}>
            {ICONS[status]}
        </span>
    );
};

export default MessageStatus;
