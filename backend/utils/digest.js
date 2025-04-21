const crypto  = require('crypto');
const {
    MERCHANT_EMAIL,
    CURRENCY
  } = require('../db/helpers.js');

function computeDigest(items, total_price, salt) {
    const itemParts = items.map(
        ({ pid, quantity, unitPrice }) =>
        `${pid}:${quantity}:${unitPrice}`
    );
    const digestInput = [
        CURRENCY,
        MERCHANT_EMAIL,
        salt,
        ...itemParts,
        total_price
    ].join('|');
    const digest = crypto
        .createHash('sha256')
        .update(digestInput)
        .digest('hex');
    return digest;
    }

module.exports = computeDigest