const express = require('express');
const Stripe  = require('stripe');

const computeDigest = require("../utils/digest");
const { getOrderById, markOrderPaid, saveTransaction, getProductByPid } = require('../db/helpers');


const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;
    if (!orderId) {
      console.warn('No orderId in metadata — skipping');
    } else {
      const existing = await getOrderById(orderId);

      if (existing) {
        const itemsForDigest = await Promise.all(
            existing.items.map(async i => {
              return {
                pid:       i.product_id,
                quantity:  i.quantity,
                unitPrice: i.unit_price
              };
            })
          );

        const existing_digest = computeDigest(
          itemsForDigest,
          existing.total_price,
          existing.salt
        );

        const stripeLineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
        const rawItems = JSON.parse(session.metadata.items); 
        const stripeItemsForDigest = stripeLineItems.data.map((item, idx) => ({
            pid:       rawItems[idx].pid,
            quantity:  item.quantity,
            unitPrice: item.price.unit_amount
        }));

        const recomputed_digest = computeDigest(
            stripeItemsForDigest,
            session.amount_total,
            session.metadata.salt
          );

        if (existing_digest !== recomputed_digest) {
          console.error('💥 Digest mismatch for order', orderId);
          return res.status(400).send('Digest verification failed');
        }

        await saveTransaction({
          orderId,
          transactionId: session.payment_intent,
          amount:        session.amount_total,
          currency:      session.currency,
          customerEmail: session.customer_details.email
        });
      }
    }
  }
  res.json({ received: true });
  }
);

module.exports = router;