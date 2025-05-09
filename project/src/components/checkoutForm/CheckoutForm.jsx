import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useStripe,
} from '@stripe/react-stripe-js';
import './CheckoutForm.css';
import { secureFetch } from '../../utils/secureFetch';

export default function CheckoutForm({ cart, discount, voucherCode }) {
  const stripe   = useStripe();
  const [status,    setStatus]    = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe) return;

    setStatus('Creating order…');

    try {
      const orderRes = await secureFetch("/api/payments/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items: cart, discount, voucherCode })
      });
      const { orderId, digest } = await orderRes.json();
  
      const sessionRes = await secureFetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderId, digest })
      });
      const { sessionId, free, error } = await sessionRes.json();

      if (error) return setStatus(`Error: there was an error with Checkout`);

      if (free) {
        navigate("/success");
        return;
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId
      });
  
      if (stripeError) {
        setStatus(`Stripe error: ${stripeError.message}`);
      } else {
        setStatus('Redirecting to payment…');
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = Math.max(0.00, (subtotal - discount).toFixed(2));

  return (
    <div className="checkout-container">
      <button
        type="button"
        className="checkout-button"
        disabled={!stripe}
        onClick={handleSubmit}
      >
        Pay ${total}
      </button>
      {status && <p className="checkout-status">{status}</p>}
    </div>
  );
}
