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
    const updateUser = async (updatedData) => {
        try {
            const res = await fetch("http://localhost:8080/api/users/update-profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(updatedData),
            });

            const data = await res.json(); // 💥 Siempre leer la respuesta

            if (!res.ok) {
                // Si no fue OK, lanza el mensaje del backend
                throw new Error(data.message || "Error al actualizar el perfil");
            }

            setUser((prev) => ({
                ...prev,
                name: data.updatedUser.name,
                email: data.updatedUser.email,
            }));

            return { success: true, message: data.message };
        } catch (err) {
            console.error("❌ Error actualizando perfil:", err);
            return { success: false, message: err.message || "Error desconocido" };
        }
    };




    return (
        <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
