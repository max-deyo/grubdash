const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if(foundDish) {
    res.locals.foundDish = foundDish;
    next();
  } else {
    return next({
      status: 404,
      message: `Dish does not exist: ${dishId}.`
    });
  }
}

function validateBody(req, res, next) {
  const { dishId } = req.params;
  const body = req.body.data;
  const foundDish = dishes.find(dish => dish.id === dishId);
  
  if(body.id && body.id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${body.id}, Route: ${dishId}`
    });
  }
  if(!body.name) {
    return next({
      status: 400,
      message: `Dish name invalid`
    });
  }
  if(!body.description) {
    return next({
      status: 400,
      message: `Dish description invalid`
    });
  }
  if(body.price < 0) {
    return next({
      status: 400,
      message: `Dish price less than 0`
    });
  }
  if(!body.price) {
    return next({
      status: 400,
      message: `Dish price needed`
    });
  }
  if(!body.image_url) {
    return next({
      status: 400,
      message: `Dish image_url invalid`
    });
  }
  next();
}

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  res.json({ data: res.locals.foundDish });
}

function create(req, res) {
  const { data: {name, description, price, image_url} = {} } = req.body;
  const newDish = {
    id: dishes.length + 1,
    name: name,
    description: description,
    price: price,
    image_url: image_url
  }
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res) {
  const { foundDish } = res.locals;
  const { dishId } = req.params;
  const { data: {id, name, description, price, image_url} = {} } = req.body;
  
  if (!Number.isInteger(price)) {
    res.status(400).json({ error: "dish price invalid" });
  }

  if (id !== undefined && id !== null && id !== "" && id !== dishId) {
    res.status(400).json({ error: `id ${id} does not match ${dishId} in the route` });
  }
  
  res.locals.foundDish.name = name;
  res.locals.foundDish.description = description;
  res.locals.foundDish.price = price;
  res.locals.foundDish.image_url = image_url;

  res.status(200).json({ data: res.locals.foundDish });
}

module.exports = {
  list: list,
  create: [validateBody, create],
  update: [dishExists, validateBody, update],
  read: [dishExists, read]
}
