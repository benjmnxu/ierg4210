const db = require('./db');

const MERCHANT_EMAIL = "email@mail.com";
const CURRENCY       = 'USD';

function saveOrder(userId, items, total_price, salt, digest) {
  return new Promise((resolve, reject) => {
    db.getConnection((err, conn) => {
      if (err) return reject(err);
      conn.beginTransaction(err => {
        if (err) {
          conn.release();
          return reject(err);
        }
        const orderSql = `
          INSERT INTO orders
            (user_id, currency, merchant_email, salt, total_price, digest)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        conn.query(
          orderSql,
          [userId, CURRENCY, MERCHANT_EMAIL, salt, total_price, digest],
          (err, result) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                reject(err);
              });
            }

            const orderId = result.insertId;
            const values  = items.map(({ pid, quantity, unitPrice }) => [orderId, pid, quantity, unitPrice]);
            const itemsSql = `
              INSERT INTO order_items
                (order_id, product_id, quantity, unit_price)
              VALUES ?
            `;
            conn.query(itemsSql, [values], err => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  reject(err);
                });
              }

              conn.commit(err => {
                conn.release();
                if (err) return reject(err);
                resolve({ orderId });
              });
            });
          }
        );
      });
    });
  });
}

function getProductByPid(pid) {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM products WHERE pid = ?',
      [pid],
      (err, rows) => {
        if (err)   return reject(err);
        if (!rows.length)
          return reject(new Error(`Product ${pid} not found`));
      resolve(rows[0]);
      }
    );
  });
}

function getOrderById(orderId) {
  return new Promise((resolve, reject) => {
    // 1) load the order header
    db.query(
      `SELECT id, user_id, currency, merchant_email, salt, total_price
         FROM orders WHERE id = ?`,
      [orderId],
      (err, rows) => {
        if (err) return reject(err);
        if (!rows.length) return resolve(null);
        const order = rows[0];

        // 2) load its items
        db.query(
          `SELECT product_id, quantity, unit_price
             FROM order_items WHERE order_id = ?`,
          [orderId],
          (err2, items) => {
            if (err2) return reject(err2);
            order.items = items;
            resolve(order);
          }
        );
      }
    );
  });
}

function markOrderPaid(orderId, transactionId) {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE orders
         SET transaction_id = ?
       WHERE id = ?`,
      [transactionId, orderId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function saveTransaction({ orderId, transactionId, amount, currency, customerEmail }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO transactions
        (order_id, transaction_id, amount, currency, customer_email)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      sql,
      [orderId, transactionId, amount, currency, customerEmail],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      }
    );
  });
}

function getTransaction(orderId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM transactions
        WHERE order_id = ?
    `;
    db.query(
      sql,
      [orderId],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}

// Export all helpers
module.exports = {
  saveOrder,
  getProductByPid,
  getOrderById,
  markOrderPaid,
  saveTransaction,
  getTransaction,
  MERCHANT_EMAIL,
  CURRENCY
};