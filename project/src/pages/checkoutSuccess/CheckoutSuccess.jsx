import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CheckoutSuccess() {
  const { search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const session_id = new URLSearchParams(search).get('session_id');
    if (!session_id) return;

    async function verifyAndClear() {
      try {
        const res  = await fetch(`/api/payments/verify?session_id=${session_id}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.paid) {
          localStorage.removeItem('cart');
        }
      } catch (err) {
        console.error('Verification error:', err);
      }
    }

    verifyAndClear();
  }, [search]);

  return (
    <div className="checkout-success">
      <h1>Thank you for your purchase!</h1>
      <button onClick={() => navigate("/recent-orders")}>
        Your Orders
      </button>
      <button onClick={() => navigate("/")}>
        Home
      </button>
    </div>
  );
}
