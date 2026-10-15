import React, { useState } from "react";
import { useChats } from "../../hooks/useChats";
import { useNotifications } from "../../hooks/useNotifications";
import type { Credentials } from "../../types";
import AddContactModal from "../AddContactModal/AddContactModal";
import ChatsList from "../ChatsList/ChatsList";
import ChatWindow from "../ChatWindow/ChatWindow";
import styles from "./Messenger.module.css";

interface MessengerProps {
    credentials: Credentials;
    onLogout: () => void;
}

const Messenger: React.FC<MessengerProps> = ({ credentials, onLogout }) => {
    const { chats, activeChat, selectChat, createChat, sendText, deleteMessage, deleteChat, handleWebhook } =
        useChats(credentials);
    const { error } = useNotifications(credentials, handleWebhook);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateChat = (phone: string, name: string) => {
        createChat(phone, name);
        setIsModalOpen(false);
    };

    return (
        <div className={styles.layout}>
            <ChatsList
                chats={chats}
                activeChatId={activeChat?.id ?? null}
                connectionError={error}
                onSelectChat={selectChat}
                onDeleteChat={deleteChat}
                onNewChat={() => setIsModalOpen(true)}
                onLogout={onLogout}
            />

            {activeChat ? (
                <ChatWindow
                    key={activeChat.id}
                    chat={activeChat}
                    onSend={sendText}
                    onDeleteMessage={deleteMessage}
                />
            ) : (
                <div className={styles.emptyState}>
                    <p>Выберите чат или создайте новый</p>
                </div>
            )}

            {isModalOpen && <AddContactModal onClose={() => setIsModalOpen(false)} onSave={handleCreateChat} />}
        </div>
    );
};

export default Messenger;
