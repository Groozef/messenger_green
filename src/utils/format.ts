export const normalizePhone = (value: string) => value.replace(/\D/g, "");

export const phoneToChatId = (phone: string) => `${phone}@c.us`;

export const formatPhone = (phone: string) => `+${phone}`;

export const getInitials = (name: string) => {
    const words = name.replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return Array.from(name.trim())[0] ?? "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
};

export const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Сегодня";
    if (date.toDateString() === yesterday.toDateString()) return "Вчера";
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
};

export const formatChatListTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const isToday = date.toDateString() === new Date().toDateString();

    return isToday ? formatTime(timestamp) : date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
};
