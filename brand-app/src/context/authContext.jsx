import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser(); // Al montar, verificar si el usuario sigue autenticado
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/auth/me", {
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                logout();
            }
        } catch (error) {
            console.error("❌ Error fetching user:", error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include",
            });

            if (res.ok) {
                fetchUser(); // ✅ Obtener el usuario después del login
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error("❌ Login error:", error);
            return false;
        }
    };

    const logout = async () => {
        await fetch("http://localhost:8080/api/auth/logout", { method: "POST", credentials: "include" });
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
