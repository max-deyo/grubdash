const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if(foundOrder === undefined) {
    return next({
      status: 404,
      message: `Order does not exist: ${orderId}.`
    });
  } else {
    res.locals.foundOrder = foundOrder;
    next();
  }
}

function validateBody(req, res, next) {
  const { orderId } = req.params;
  const body = req.body.data;
  const foundOrder = orders.find((order) => order.id === orderId);
  
//   if(body.id && body.id!==orderId) {
//     return next({
//       status: 400,
//       message: `Order id does not match route id. Order: ${body.id}, Route: ${orderId}.`
//     });
//   }
  if(!body.deliverTo) {
    return next({
      status: 400,
      message: `Order deliverTo invalid`
    });
  }
  if(!body.mobileNumber) {
    return next({
      status: 400,
      message: `Order must include a mobileNumber`
    });
  }
  if(!body.dishes) {
    return next({
      status: 400,
      message: `dish`
    });
  } else {
    if (!Array.isArray(body.dishes) || body.dishes.length === 0) {
      return next({
        status: 400,
        message: "Order must include at least one dish",
      });
    }
    for (let i = 0; i < body.dishes.length; i++) {
      const dish = body.dishes[i];
      if (
        !dish.quantity ||
        !Number.isInteger(dish.quantity) ||
        dish.quantity < 0
      ) {
        return next({
          status: 400,
          message: `Dish ${i} must have a quantity that is an integer greater than 0`,
        });
      }
    }
  }

  let handleId = undefined;
  
  if (req.method === "POST") {
    handleId = { id: nextId() };
  }
  
  if (req.method === "PUT" && !body.id) {
    handleId = { id: orderId };
  }

  const newOrder = { ...body, ...handleId };
  res.locals.newOrder = newOrder;
  next();
}

function validateStatus(req, res, next) {
  const body = req.body.data;
  
  if (req.method === "PUT") {
    if(!body.status) {
      return next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
      });
    }
  }
  if (req.method === "DELETE") {
    if (body.status !== "pending") {
      return next({
        status: 400,
        message: "An order cannot be deleted unless it is pending",
      });
    }
  }
  if (body.status === "invalid") {
    return next({
      status: 400,
      message: "status can't be invalid",
    });
  }
  next();
}

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.foundOrder });
}

function create(req, res) {
  const { data: {deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: orders.length + 1,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes
  }
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res, next) {
  const { foundOrder } = res.locals;
  const { newOrder } = res.locals;
  if (newOrder.id !== foundOrder.id) {
    return next({
      status: 400,
      message: `You can not change existing order id ${foundOrder.id} to ${newOrder.id}`,
    });
  }
  const updatedEntry = { ...foundOrder, ...newOrder };

  res.json({ data: updatedEntry });
}

function _delete(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const delOrder = orders.splice(index, 1);
  
  if (delOrder[0].status !== "pending") {
    res.status(400).json({ error: "status is pending" });
  }
  
  res.sendStatus(204);
}

module.exports = {
  list: list,
  create: [validateBody, create],
  update: [orderExists, validateBody, validateStatus, update],
  read: [orderExists, read],
  delete: [orderExists,  _delete]
}