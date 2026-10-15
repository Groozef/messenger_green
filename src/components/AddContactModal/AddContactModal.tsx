import React, { useEffect, useState } from "react";
import { getInitials, normalizePhone } from "../../utils/format";
import styles from "./AddContactModal.module.css";

interface AddContactModalProps {
    onClose: () => void;
    onSave: (phone: string, name: string) => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ onClose, onSave }) => {
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);

    const digits = normalizePhone(phone);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (digits.length < 10 || digits.length > 15) {
            setError("Введите номер в международном формате, например 79991234567");
            return;
        }

        onSave(digits, name.trim());
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.modalTitle}>Новый чат</h3>

                <div className={styles.avatarRow}>
                    <div className={styles.modalAvatar}>{name.trim() ? getInitials(name) : "👤"}</div>
                    <div>
                        <div className={styles.contactNamePreview}>{name.trim() || "Без имени"}</div>
                        <div className={styles.contactPhonePreview}>{digits ? `+${digits}` : "Номер не введен"}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <label className={styles.inputGroup}>
                        <span className={styles.label}>Номер телефона</span>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                setError(null);
                            }}
                            className={styles.input}
                            placeholder="+7 999 123 45 67"
                            autoFocus
                        />
                    </label>

                    <label className={styles.inputGroup}>
                        <span className={styles.label}>Имя (необязательно)</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={styles.input}
                        />
                    </label>

                    {error && <p className={styles.error}>{error}</p>}

                    <div className={styles.actionsRow}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className={styles.saveBtn}>
                            Создать
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddContactModal;
