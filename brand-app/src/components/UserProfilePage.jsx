import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/authContext";

const UserProfilePage = () => {
    const { user } = useContext(AuthContext);
    const [address, setAddress] = useState(user?.address || "");

    const handleSave = () => {
        // Aquí puedes hacer la lógica para actualizar la dirección
        console.log("Address saved:", address);
    };

    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-4">User Profile</h1>
            <div className="mb-4">
                <label className="block">Address</label>
                <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 border rounded"
                />
            </div>
            <button onClick={handleSave} className="bg-blue-500 text-white p-2 rounded">
                Save Address
            </button>
        </div>
    );
};

export default UserProfilePage;
