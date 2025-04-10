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
import SuccessPage from "./components/SuccessPage";
import { AuthProvider } from './context/authContext'; // Import the AuthProvider


const stripePromise = loadStripe('your-publishable-key-here'); // Replace with your Stripe publishable key

const App = () => {
  return (
    <Router>
      <AuthProvider> {/* Wrap with AuthProvider */}

        <CartProvider>
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
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>

        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
