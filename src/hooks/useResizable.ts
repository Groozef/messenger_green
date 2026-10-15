import { useEffect, useRef, useState } from "react";

export const useResizable = (initialWidth: number, minWidth: number, maxWidth: number) => {
    const [width, setWidth] = useState(initialWidth);
    const isResizing = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            setWidth(Math.min(Math.max(minWidth, e.clientX), maxWidth));
        };

        const handleMouseUp = () => {
            if (!isResizing.current) return;
            isResizing.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [minWidth, maxWidth]);

    const startResizing = () => {
        isResizing.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    };

    return { width, startResizing };
};
