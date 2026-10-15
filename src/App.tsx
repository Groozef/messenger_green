import { useState } from "react";
import LoginForm from "./components/LoginForm/LoginForm";
import Messenger from "./components/Messenger/Messenger";
import { clearCredentials, loadCredentials, saveCredentials } from "./services/storage";
import type { Credentials } from "./types";
import "./App.css";

function App() {
    const [credentials, setCredentials] = useState<Credentials | null>(loadCredentials);

    const handleLogin = (newCredentials: Credentials) => {
        saveCredentials(newCredentials);
        setCredentials(newCredentials);
    };

    const handleLogout = () => {
        clearCredentials();
        setCredentials(null);
    };

    if (!credentials) {
        return <LoginForm onLogin={handleLogin} />;
    }

    return <Messenger key={credentials.idInstance} credentials={credentials} onLogout={handleLogout} />;
}

export default App;
