import React, { useMemo, useState } from "react";
import { useResizable } from "../../hooks/useResizable";
import type { Chat } from "../../types";
import { formatChatListTime, getInitials } from "../../utils/format";
import ContextMenu from "../ContextMenu/ContextMenu";
import MessageStatus from "../MessageStatus/MessageStatus";
import styles from "./ChatsList.module.css";

interface ChatsListProps {
    chats: Chat[];
    activeChatId: string | null;
    connectionError: string | null;
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (chatId: string) => void;
    onNewChat: () => void;
    onLogout: () => void;
}

const getLastActivity = (chat: Chat) => chat.messages.at(-1)?.timestamp ?? chat.createdAt;

const ChatsList: React.FC<ChatsListProps> = ({
    chats,
    activeChatId,
    connectionError,
    onSelectChat,
    onDeleteChat,
    onNewChat,
    onLogout,
}) => {
    const { width, startResizing } = useResizable(350, 250, 450);
    const [search, setSearch] = useState("");
    const [menu, setMenu] = useState<{ x: number; y: number; chat: Chat } | null>(null);

    const handleDeleteChat = (chat: Chat) => {
        if (confirm(`Удалить чат «${chat.name}»? Переписка удалится только из этого приложения.`)) {
            onDeleteChat(chat.id);
        }
    };

    const visibleChats = useMemo(() => {
        const query = search.trim().toLowerCase();

        return chats
            .filter((chat) => !query || chat.name.toLowerCase().includes(query) || chat.phone?.includes(query))
            .sort((a, b) => getLastActivity(b) - getLastActivity(a));
    }, [chats, search]);

    return (
        <aside className={styles.container} style={{ width }}>
            <div className={styles.header}>
                <button className={styles.iconBtn} onClick={onLogout} title="Выйти">
                    ⎋
                </button>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск"
                    className={styles.searchBar}
                />
                <button className={styles.iconBtn} onClick={onNewChat} title="Новый чат">
                    +
                </button>
            </div>

            {connectionError && <div className={styles.connectionError}>{connectionError}</div>}

            <ul className={styles.list}>
                {visibleChats.length === 0 && (
                    <li className={styles.placeholder}>
                        {search ? "Ничего не найдено" : "Чатов пока нет. Нажмите «+», чтобы начать"}
                    </li>
                )}

                {visibleChats.map((chat) => {
                    const lastMessage = chat.messages.at(-1);

                    return (
                        <li
                            key={chat.id}
                            className={`${styles.item} ${chat.id === activeChatId ? styles.activeItem : ""}`}
                            onClick={() => onSelectChat(chat.id)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setMenu({ x: e.clientX, y: e.clientY, chat });
                            }}
                        >
                            <div className={styles.avatar}>{getInitials(chat.name)}</div>

                            <div className={styles.info}>
                                <div className={styles.infoTop}>
                                    <div className={styles.name}>{chat.name}</div>
                                    <div className={styles.meta}>
                                        {lastMessage && <MessageStatus message={lastMessage} />}
                                        <span className={styles.time}>{formatChatListTime(getLastActivity(chat))}</span>
                                    </div>
                                </div>
                                <div className={styles.infoBottom}>
                                    <p className={styles.messagePreview}>
                                        {lastMessage
                                            ? `${lastMessage.fromMe ? "Вы: " : ""}${lastMessage.text}`
                                            : "Нет сообщений"}
                                    </p>
                                    {chat.unread > 0 && (
                                        <span className={styles.badge}>{chat.unread > 999 ? "999+" : chat.unread}</span>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <div className={styles.resizer} onMouseDown={startResizing} />

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    items={[{ label: "Удалить чат", danger: true, onClick: () => handleDeleteChat(menu.chat) }]}
                    onClose={() => setMenu(null)}
                />
            )}
        </aside>
    );
};

export default ChatsList;
