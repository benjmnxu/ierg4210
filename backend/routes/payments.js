const express = require('express');
const Stripe  = require('stripe');
const crypto  = require('crypto');
const {
  getProductByPid,
  saveOrder,
  getOrderById,
  saveTransaction,
  getTransaction,
  getVoucher,
  CURRENCY,
} = require('../db/helpers.js');
const computeDigest = require ("../utils/digest");

require("dotenv").config();

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
  const { items, voucherCode, discount } = req.body;
  const userId = req.session.uid ?? null;

  let total_price = 0;
  const enrichedItems = [];

  for (let { pid, quantity } of items) {
    const p = await getProductByPid(pid);
    const centsPrice = p.price * 100;
    total_price += centsPrice * quantity;

    enrichedItems.push({
      pid,
      quantity,
      unitPrice: centsPrice
    });
  }

  let validatedDiscount = 0;
  if (voucherCode) {
    const voucher = await getVoucher(voucherCode);
    if (!voucher) {
      return res.status(400).json({ error: 'Invalid voucher code' });
    }

    validatedDiscount = Math.round(parseFloat(voucher.discount_amount) * 100);

    if (validatedDiscount !== Math.round(discount * 100)) {
      return res.status(400).json({ error: 'Discount mismatch' });
    }

    total_price = Math.max(0, total_price - validatedDiscount);
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const digest = computeDigest(enrichedItems, total_price, salt);
  const { orderId } = await saveOrder(userId, enrichedItems, total_price, salt, digest, voucherCode ?? null, validatedDiscount);

  res.json({ orderId, digest });
});

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { orderId, digest } = req.body;

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(400).json({ error: 'Order not found or not pending' });
    }
    if (order.total_price === 0) {
      const nonce = crypto.randomBytes(16).toString('hex');
      await saveTransaction({
        orderId,
        transactionId: "FREE_ORDER" + nonce,
        amount: 0,
        currency: "usd",
        customerEmail: order.email ?? "free@order.local"
      });
      return res.json({ sessionId: null, free: true });
    }

    let discount = order.discount_cents;

    const line_items = await Promise.all(
      order.items.map(async ({ product_id, quantity }) => {
        const p = await getProductByPid(product_id);
        let unitAmount = Math.round(parseFloat(p.price) * 100);
    
        return {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: p.name,
            },
            unit_amount: unitAmount,
          },
          quantity,
        };
      })
    );

    let coupon;

    if (discount) {
      coupon = await stripe.coupons.create({
        amount_off: discount,
        currency: CURRENCY,
        duration: 'once',
      })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      discounts: coupon ? [{ coupon: coupon.id }] : undefined,
      mode: 'payment',
      success_url: `${process.env.NODE_ENV == "dev" ? "http://localhost:5173" : "http://s36.ierg4210.ie.cuhk.edu.hk"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NODE_ENV == "dev" ? "http://localhost:5173" : "http://s36.ierg4210.ie.cuhk.edu.hk"}/cancel`,
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
