import { useState, useEffect } from 'react';
import {
  useStripe,
} from '@stripe/react-stripe-js';
import './CheckoutForm.css';

export default function CheckoutForm({ cart }) {
  const stripe   = useStripe();
  const [csrfToken, setCsrfToken] = useState('');
  const [status,    setStatus]    = useState('');

  useEffect(() => {
    fetch('/api/csrf-token', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(console.error);
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe) return;

    setStatus('Creating order…');

    try {
      const orderRes = await fetch('/api/payments/order', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify({ items: cart })
      });
      const {orderId, digest} = await orderRes.json();

      const sessionRes = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify({ orderId, digest })
      });
      const { sessionId, error } = await sessionRes.json();
      if (error) return setStatus(`Error: ${error}`)

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

  const total = (cart.reduce((sum, i) => sum + i.price * i.quantity, 0)).toFixed(2);

  return (
    <div className="checkout-container">
      <button
        type="button"
        className="checkout-button"
        disabled={!stripe || !csrfToken}
        onClick={handleSubmit}
      >
        Pay ${total}
      </button>
      {status && <p className="checkout-status">{status}</p>}
    </div>
  );
}
