import { useState, useRef, useEffect } from "react";
import styles from "./ChatsList.module.css";

interface ChatItem {
    id: number;
    name: string;
    text: string;
    unread: number;
    initial: string;
}

const MOCK_CHATS: ChatItem[] = [
    { id: 1, name: "Express Charter KZ", text: "Almaty ---> Nha Chang (Vietnam)", unread: 0, initial: "EC" },
    { id: 2, name: "Alina", text: "Almaty ---> Nha Chang (Vietnam)", unread: 0, initial: "АЕ" },
    { id: 3, name: "GazizBack", text: "Almaty ---> Nha Chang (Vietnam)", unread: 1, initial: "EC" },
    { id: 4, name: "Тестовый Чат 4", text: "Привет! Как дела?", unread: 0, initial: "ТЧ" },
    { id: 5, name: "Тестовый Чат 5", text: "Последнее сообщение...", unread: 4, initial: "ТЧ" },
    { id: 6, name: "Тестовый Чат 6", text: "Скролл работает отлично", unread: 0, initial: "ТЧ" },
    { id: 7, name: "Тестовый Чат 7", text: "Текст сообщения", unread: 0, initial: "ТЧ" },
    { id: 8, name: "Тестовый Чат 8", text: "Текст сообщения", unread: 0, initial: "ТЧ" },
    { id: 9, name: "Тестовый Чат 9", text: "Текст сообщения", unread: 0, initial: "ТЧ" },
    { id: 10, name: "Тестовый Чат 10", text: "Текст сообщения", unread: 0, initial: "ТЧ" },
    { id: 11, name: "Тестовый Чат 11", text: "Текст сообщения", unread: 0, initial: "ТЧ" },
    { id: 12, name: "Тестовый Чат 12", text: "Привет! Как дела?", unread: 0, initial: "ТЧ" },
    { id: 13, name: "Тестовый Чат 13", text: "Последнее сообщение...", unread: 4, initial: "ТЧ" },
    { id: 14, name: "Тестовый Чат 14", text: "Скролл работает отлично", unread: 0, initial: "ТЧ" },
];

const ChatsList = () => {
    const [width, setWidth] = useState<number>(350);
    const isResizing = useRef<boolean>(false);

    const startResizing = () => {
        isResizing.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            if (!isResizing.current) return;
            const newWidth = Math.min(Math.max(250, e.clientX), 450);
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = "default";
            document.body.style.userSelect = "auto";
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    return (
        <aside className={styles.container} style={{ width: `${width}px` }}>
            <div className={styles.header}>
                <input
                    type="text"
                    name="chat_search"
                    id="chat_search"
                    placeholder="Поиск"
                    className={styles.searchBar}
                />
            </div>

            <ul className={styles.list}>
                {MOCK_CHATS.map((chat) => (
                    <li key={chat.id} className={styles.item}>
                        <div className={styles.avatarWrapper}>
                            <div className={styles.avatar}>{chat.initial}</div>
                            {chat.unread > 0 && (
                                <span className={styles.badge}>{chat.unread > 999 ? "999+" : chat.unread}</span>
                            )}
                        </div>

                        <div className={styles.info}>
                            <div className={styles.infoTop}>
                                <div className={styles.name}>{chat.name}</div>
                                <div className={styles.time}>{"15:05"}</div>
                            </div>
                            <p className={styles.messagePreview}>{chat.text}</p>
                        </div>
                    </li>
                ))}
            </ul>

            <div className={styles.resizer} onMouseDown={startResizing} />
        </aside>
    );
};

export default ChatsList;
