import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/authContext";

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    if (!user || !user.isAdmin) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;
