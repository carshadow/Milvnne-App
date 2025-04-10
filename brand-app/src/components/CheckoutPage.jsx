import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/authContext'; // Import AuthContext
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Stripe initialization
const stripePromise = loadStripe("your-publishable-key-here"); // Replace with your Stripe publishable key

const CheckoutPage = () => {
    const { cart } = useContext(CartContext);
    const { user } = useContext(AuthContext); // Check if user is logged in
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const totalAmount = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    const handleCheckout = async () => {
        if (!address) {
            alert("Please provide a shipping address.");
            return;
        }

        setLoading(true);

        try {
            // Send checkout data to the backend
            const orderData = {
                items: cart.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity
                })),
                totalAmount,
                address,
                userId: user ? user._id : null,  // If logged in, pass userId
            };

            const response = await fetch("http://localhost:8080/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (response.ok) {
                // After successful checkout, proceed with Stripe payment
                // Assuming you have a separate Stripe payment method
                navigate("/success"); // Or navigate to a success page
            } else {
                setError(data.message || "Checkout failed");
            }
        } catch (error) {
            setError("Error occurred during checkout");
        }

        setLoading(false);
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold">Checkout</h2>
            <div className="mt-4">
                <label htmlFor="address" className="block">Shipping Address</label>
                <textarea
                    id="address"
                    rows="4"
                    className="w-full border p-2 mt-2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
            </div>

            {error && <p className="text-red-500 mt-4">{error}</p>}

            <div className="mt-6">
                <h3 className="font-semibold">Total: ${totalAmount}</h3>
            </div>

            <button
                onClick={handleCheckout}
                className="mt-6 px-6 py-3 bg-blue-500 text-white rounded"
                disabled={loading}
            >
                {loading ? "Processing..." : "Place Order"}
            </button>
        </div>
    );
};

export default CheckoutPage;
