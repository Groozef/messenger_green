import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";

interface EmojiPanelProps {
    onSelect: (emoji: string) => void;
}

const EmojiPanel = ({ onSelect }: EmojiPanelProps) => (
    <EmojiPicker
        theme={Theme.DARK}
        onEmojiClick={(data: EmojiClickData) => onSelect(data.emoji)}
        searchPlaceholder="Поиск эмодзи..."
        height={380}
        width={300}
    />
);

export default EmojiPanel;
