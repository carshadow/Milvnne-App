import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Products from './components/Products';
import ProductDetail from './components/ProductDetail';
import CartPage from './components/CartPage';
import { CartProvider } from './context/CartContext';
// import CheckoutPage from './components/CheckoutPage';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import SuccessPage from './components/SuccessPage';
import { AuthProvider } from './context/authContext';
import EditUserProfile from './components/EditUserProfile';
import AdminRoute from './components/AdminRoute';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { ToastContainer } from "react-toastify";



const stripePromise = loadStripe('your-publishable-key-here'); // Replace with your Stripe publishable key

const App = () => {
  return (
    <Router>
      <AuthProvider> {/* Wrap with AuthProvider */}

        <CartProvider>
          <ToastContainer />
          <Navbar />
          <Routes>
            <Route path="/" element={<Products />} />
            <Route path="/products" element={<Hero />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* <Route
              path="/checkout"
              element={
                <Elements stripe={stripePromise}>
                  <CheckoutPage />
                </Elements>
              }
            /> */}
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <EditUserProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>

        </CartProvider>
      </AuthProvider>

    </Router>
  );
};

export default App;
