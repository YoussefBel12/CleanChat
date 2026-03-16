import React, { createContext, useContext, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

const SignalRContext = createContext(null);

 export  function useSignalR() {
    return useContext(SignalRContext);
}

export default function SignalRProvider({ children }) {
    const connectionRef = useRef(null);
    const [connected, setConnected] = useState(false);

    async function connect(token) {
        if (!token) return;
        try {
            // If a previous connection exists, stop it first
            if (connectionRef.current) {
                try { await connectionRef.current.stop(); } catch { }
                connectionRef.current = null;
                setConnected(false);
            }

            const connection = new signalR.HubConnectionBuilder()
                .withUrl("/chatHub", { accessTokenFactory: () => localStorage.getItem("token") })
                .withAutomaticReconnect()
                .build();

            connectionRef.current = connection;

            // start only if disconnected
            if (connection.state === "Disconnected") {
                await connection.start();
            }

            setConnected(true);
            return connection;
        } catch (err) {
            console.warn("SignalR connect error", err);
            setConnected(false);
            throw err;
        }
    }

    async function disconnect() {
        if (!connectionRef.current) return;
        try {
            await connectionRef.current.stop();
        } catch (err) {
            console.warn("SignalR stop error", err);
        } finally {
            connectionRef.current = null;
            setConnected(false);
        }
    }

    const value = {
        connectionRef,
        connected,
        connect,
        disconnect,
    };

    return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>;
}
