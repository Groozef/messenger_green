import { useEffect, useEffectEvent, type RefObject } from "react";

export const useClickOutside = (ref: RefObject<HTMLElement | null>, onOutsideClick: () => void, enabled = true) => {
    const handleOutsideClick = useEffectEvent(onOutsideClick);

    useEffect(() => {
        if (!enabled) return;

        const handleMouseDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                handleOutsideClick();
            }
        };

        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [ref, enabled]);
};
