import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("https://clothing-backend.fly.dev/api/auth/me", {
                headers: {
                    Authorization: `Bearer ${token}`, // ✅ PASA EL TOKEN AQUÍ
                },
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                localStorage.removeItem("token");
                setUser(null);
            }
        } catch (error) {
            console.error("❌ Error fetching user:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };


    const login = async (email, password) => {
        try {
            const res = await fetch("https://clothing-backend.fly.dev/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Error al iniciar sesión");
            }

            localStorage.setItem("token", data.token); // ✅ guardar el token
            setUser(data.user);
            return true;
        } catch (error) {
            console.error("❌ Login error:", error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };



    const updateUser = async (updatedData) => {
        try {
            //  Primero obtener el CSRF Token
            const csrfRes = await fetch("https://clothing-backend.fly.dev/api/csrf-token", {
                credentials: "include",
            });
            const csrfData = await csrfRes.json();
            const csrfToken = csrfData.csrfToken;

            const res = await fetch("https://clothing-backend.fly.dev/api/users/update-profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrfToken, //  Aquí se pasa el token
                },
                credentials: "include",
                body: JSON.stringify(updatedData)
            });

            const data = await res.json(); //  siempre leer la respuesta

            if (!res.ok) {
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
