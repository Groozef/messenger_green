import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { isLocalOnly } from "../../hooks/useChats";
import { useClickOutside } from "../../hooks/useClickOutside";
import type { Chat, Message } from "../../types";
import { formatDate, formatPhone, formatTime, getInitials } from "../../utils/format";
import ContextMenu, { type ContextMenuItem } from "../ContextMenu/ContextMenu";
import MessageStatus from "../MessageStatus/MessageStatus";
import styles from "./ChatWindow.module.css";

const EmojiPanel = lazy(() => import("./EmojiPanel"));

interface ChatWindowProps {
    chat: Chat;
    onSend: (chatId: string, text: string) => void;
    onDeleteMessage: (chat: Chat, message: Message, forEveryone: boolean) => Promise<void>;
}

interface MessageMenu {
    x: number;
    y: number;
    message: Message;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onSend, onDeleteMessage }) => {
    const [inputText, setInputText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [menu, setMenu] = useState<MessageMenu | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const emojiAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useClickOutside(emojiAreaRef, () => setShowEmojiPicker(false), showEmojiPicker);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat.messages.length]);

    const handleEmojiSelect = (emoji: string) => {
        setInputText((prev) => prev + emoji);
        inputRef.current?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const text = inputText.trim();
        if (!text) return;

        onSend(chat.id, text);
        setInputText("");
        setShowEmojiPicker(false);
    };

    const handleDelete = async (message: Message, forEveryone: boolean) => {
        try {
            await onDeleteMessage(chat, message, forEveryone);
        } catch (err) {
            console.error(err);
            alert("Не удалось удалить сообщение");
        }
    };

    const getMenuItems = (message: Message): ContextMenuItem[] => {
        if (isLocalOnly(message)) {
            return [{ label: "Удалить", danger: true, onClick: () => handleDelete(message, false) }];
        }

        return [
            { label: "Удалить у всех", danger: true, onClick: () => handleDelete(message, true) },
            { label: "Удалить у меня", onClick: () => handleDelete(message, false) },
        ];
    };

    const subtitle = chat.phone && chat.name !== formatPhone(chat.phone) ? formatPhone(chat.phone) : "Telegram";

    return (
        <section className={styles.windowContainer}>
            <header className={styles.header}>
                <div className={styles.avatar}>{getInitials(chat.name)}</div>
                <div className={styles.infoBlock}>
                    <div className={styles.title}>{chat.name}</div>
                    <div className={styles.status}>{subtitle}</div>
                </div>
            </header>

            <div className={styles.messagesContainer}>
                <div className={styles.messagesList}>
                    {chat.messages.length === 0 && (
                        <div className={styles.dateSeparator}>Напишите первое сообщение</div>
                    )}

                    {chat.messages.map((message, index) => {
                        const prev = chat.messages[index - 1];
                        const date = formatDate(message.timestamp);
                        const showDate = !prev || formatDate(prev.timestamp) !== date;

                        return (
                            <React.Fragment key={message.id}>
                                {showDate && <div className={styles.dateSeparator}>{date}</div>}

                                <div
                                    className={`${styles.messageWrapper} ${
                                        message.fromMe ? styles.myMsgWrapper : styles.otherMsgWrapper
                                    }`}
                                >
                                    <div
                                        className={`${styles.messageBubble} ${
                                            message.fromMe ? styles.myBubble : styles.otherBubble
                                        }`}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setMenu({ x: e.clientX, y: e.clientY, message });
                                        }}
                                    >
                                        <p className={styles.messageText}>{message.text}</p>
                                        {(message.reactions?.mine || message.reactions?.theirs) && (
                                            <div className={styles.reactions}>
                                                {message.reactions.theirs && (
                                                    <span className={styles.reaction}>{message.reactions.theirs}</span>
                                                )}
                                                {message.reactions.mine && (
                                                    <span className={`${styles.reaction} ${styles.myReaction}`}>
                                                        {message.reactions.mine}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className={styles.messageMeta}>
                                            {message.edited && <span className={styles.time}>изменено</span>}
                                            <span className={styles.time}>{formatTime(message.timestamp)}</span>
                                            <MessageStatus message={message} />
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <form className={styles.inputBar} onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Написать сообщение..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className={styles.inputField}
                    maxLength={4096}
                    autoFocus
                />

                <div className={styles.emojiArea} ref={emojiAreaRef}>
                    {showEmojiPicker && (
                        <div className={styles.emojiPickerWrapper}>
                            <Suspense fallback={<div className={styles.emojiLoading}>Загрузка...</div>}>
                                <EmojiPanel onSelect={handleEmojiSelect} />
                            </Suspense>
                        </div>
                    )}
                    <button
                        type="button"
                        className={`${styles.iconBtn} ${showEmojiPicker ? styles.iconBtnActive : ""}`}
                        title="Эмодзи"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                    >
                        ☺
                    </button>
                </div>

                <button type="submit" className={styles.sendBtn} title="Отправить" disabled={!inputText.trim()}>
                    ➤
                </button>
            </form>

            {menu && (
                <ContextMenu x={menu.x} y={menu.y} items={getMenuItems(menu.message)} onClose={() => setMenu(null)} />
            )}
        </section>
    );
};

export default ChatWindow;
