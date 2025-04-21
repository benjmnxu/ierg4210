const express = require('express');
const Stripe  = require('stripe');
const crypto  = require('crypto');
const {
  getProductByPid,
  saveOrder,
  getOrderById,
  getTransaction,
} = require('../db/helpers.js');
const computeDigest = require ("../utils/digest");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

router.get('/verify', async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) return res.status(400).json({ error: 'Missing session_id' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    const paidByStripe = session.payment_status === 'paid';

    const order = await getOrderById(session.metadata.orderId);
    const transaction = await getTransaction(session.metadata.orderId);
    const paidInDb = order && !!transaction;

    res.json({ paid: paidByStripe && paidInDb });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/order', async (req, res) => {
  const items = req.body.items;
  const userId = req.session.uid ?? null;
  let total_price = 0;
  const enrichedItems = [];
  for (let { pid, quantity } of items) {
    const p = await getProductByPid(pid);
    centsPrice = p.price * 100;
    total_price += centsPrice * quantity;

    enrichedItems.push({
      pid,
      quantity,
      unitPrice: centsPrice
    });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const digest = computeDigest(enrichedItems, total_price, salt);
  const { orderId } = await saveOrder(userId, enrichedItems, total_price, salt, digest, false);
  res.json({ orderId, digest });
})
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { orderId, digest } = req.body;

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(400).json({ error: 'Order not found or not pending' });
    }

    const line_items = await Promise.all(
      order.items.map(async ({ product_id, quantity }) => {
        const p = await getProductByPid(product_id);
        const unitAmount = Math.round(parseFloat(p.price) * 100);
    
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: p.name,
            },
            unit_amount: unitAmount,
          },
          quantity,
        };
      })
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `http://localhost:5173/cancel`,
      client_reference_id: orderId.toString(),
      metadata: {
        orderId: orderId.toString(),
        salt: order.salt,
        items: JSON.stringify(order.items.map(i => ({ pid: i.product_id })))
      },
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
