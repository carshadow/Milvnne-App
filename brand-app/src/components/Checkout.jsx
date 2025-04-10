// import React, { useState } from 'react';
// import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// const CheckoutPage = ({ totalAmount = 0 }) => {
//     const stripe = useStripe();
//     const elements = useElements();
//     const [loading, setLoading] = useState(false);

//     const handleSubmit = async (event) => {
//         event.preventDefault();

//         // Obtén el monto y la moneda de tu formulario o estado
//         const amount = totalAmount * 100;  // Multiplicar por 100 para convertir a centavos
//         const currency = 'usd';  // Ejemplo de moneda

//         // Llama a tu servidor para crear el PaymentIntent
//         const response = await fetch('http://localhost:8080/create-payment-intent', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ amount, currency }),
//         });

//         const data = await response.json();

//         // Asegúrate de que el client_secret está en la respuesta
//         const { clientSecret } = data;
//         if (!clientSecret) {
//             console.error('Missing client secret');
//             return;
//         }

//         // Usa el client_secret para confirmar el pago
//         const cardElement = elements.getElement(CardElement);

//         const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
//             payment_method: {
//                 card: cardElement,  // El elemento de la tarjeta de Stripe que has creado
//                 billing_details: {
//                     name: 'Nombre del cliente',
//                 },
//             },
//         });

//         if (error) {
//             console.error('Error confirming payment', error);
//         } else if (paymentIntent.status === 'succeeded') {
//             console.log('Pago exitoso');
//         }
//     };

//     return (
//         <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
//             <h1 className="text-2xl font-bold text-indigo-600 text-center mb-4">Checkout</h1>
//             <p className="text-gray-600 text-center mb-6">
//                 Monto total: <span className="font-bold">${totalAmount ? totalAmount.toFixed(2) : '0.00'}</span>
//             </p>
//             <form onSubmit={handleSubmit} className="space-y-6">
//                 <div className="border rounded-lg p-4 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
//                     <CardElement
//                         options={{
//                             style: {
//                                 base: { fontSize: '16px', color: '#333', '::placeholder': { color: '#aaa' } },
//                                 invalid: { color: '#e3342f' },
//                             },
//                         }}
//                     />
//                 </div>
//                 <button
//                     type="submit"
//                     disabled={!stripe || loading}
//                     className={`w-full py-3 text-white font-bold rounded-lg transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'
//                         }`}
//                 >
//                     {loading ? 'Procesando...' : 'Pagar ahora'}
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default CheckoutPage;
