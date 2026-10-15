import { useEffect, useRef } from "react";
import { useClickOutside } from "../../hooks/useClickOutside";
import styles from "./ContextMenu.module.css";

export interface ContextMenuItem {
    label: string;
    danger?: boolean;
    onClick: () => void;
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

const MENU_WIDTH = 200;
const ITEM_HEIGHT = 36;

const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
    const menuRef = useRef<HTMLUListElement>(null);

    useClickOutside(menuRef, onClose);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("resize", onClose);
        window.addEventListener("wheel", onClose);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", onClose);
            window.removeEventListener("wheel", onClose);
        };
    }, [onClose]);

    const left = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
    const top = Math.min(y, window.innerHeight - items.length * ITEM_HEIGHT - 16);

    return (
        <ul ref={menuRef} className={styles.menu} style={{ left, top, width: MENU_WIDTH }}>
            {items.map((item) => (
                <li key={item.label}>
                    <button
                        className={`${styles.item} ${item.danger ? styles.danger : ""}`}
                        onClick={() => {
                            onClose();
                            item.onClick();
                        }}
                    >
                        {item.label}
                    </button>
                </li>
            ))}
        </ul>
    );
};

export default ContextMenu;
