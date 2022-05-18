const Order = require('../models/order.model');
const User = require('../models/user.model');

const PUBLISHER_KEY = "pk_test_51L0nXSSIGhsufb4hxeghOmXrBB0Qt0ywOLt0CteKMC7hRX39oR2eS19QUtkfikcuBxoLoDAW2lduVMKSg4tn8cRK00WAf3zGar";
const SECRET_KEY = "sk_test_51L0nXSSIGhsufb4hFuYjt9frmP659zekVSBjvnKdSTg4VzIFzg0jx5B6VtXfiuDHk5okfj4qHlKbERAJBrDu49Lo00pYYZW0D8";

const stripe = require('stripe')(SECRET_KEY);

async function getOrders(req, res) {
  try {
    const orders = await Order.findAllForUser(res.locals.uid);
    res.render('customer/orders/all-orders', {
      orders: orders
    });
  } catch (error) {
    next(error);
  }
}

async function addOrder(req, res, next) {
  const cart = res.locals.cart;

  let userDocument;
  try {
    userDocument = await User.findById(res.locals.uid);
  } catch (error) {
    return next(error);
  }

  const order = new Order(cart, userDocument);

  try {
    await order.save();
  } catch (error) {
    next(error);
    return;
  }

  req.session.cart = null;

  
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cart.items.map(function(item){
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.product.title,
            },
            unit_amount: +item.product.price * 100,
          },
          quantity: item.quantity,
        }
      }),
      mode: 'payment',
      success_url: 'https://localhost:3000/orders/success',
      cancel_url: 'https://localhost:3000/orders/cancel',
    });
  
    res.redirect(303, session.url);

}

function getSuccess(req, res){
  res.render('customer/orders/success');
}

function getFailure(req, res){
  res.render('customer/orders/failure');
}

module.exports = {
  addOrder: addOrder,
  getOrders: getOrders,
  getSuccess: getSuccess,
  getFailure: getFailure
};
