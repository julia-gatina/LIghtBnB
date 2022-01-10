const properties = require('./json/properties.json');
const users = require('./json/users.json');

const {
  Pool
} = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = (email) => {
  const queryString = `SELECT * FROM users WHERE email = $1`;
  const value = [email];
  return pool
    .query(queryString, value)
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = (id) => {
  const queryString = 'SELECT * FROM users AS u WHERE u.id = $1';
  const value = [id];
  return pool
    .query(queryString, value)
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    })
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = (user) => {
  const queryString =
    `INSERT INTO users (name, email, password) 
    VALUES ($1, $2, $3)
    RETURNING id`;
  const values = [user.name, user.email, user.password];

  return pool
    .query(queryString, values)
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    })
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const queryString =
    `SELECT * FROM reservations AS r 
    JOIN properties AS p ON r.property_id = p.id
    JOIN property_reviews AS pr ON p.id = pr.property_id
    WHERE r.guest_id = $1 LIMIT $2`;
  const values = [guest_id, limit];
  return pool
    .query(queryString, values)
    .then((result) => result.rows)
    .catch((err) => {
      console.log(err.message);
    });
}

exports.getAllReservations = getAllReservations;

/// Properties

//helper function for getAllProperties
const queryConstructor = function(array) {
  let valueToUse = '';
  if (array.length > 1) {
    valueToUse = 'AND';
  } else if (array.length === 1) {
    valueToUse = 'WHERE';
  }
  return valueToUse;
};

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const valuesArray = [];

  // initial query before user input
  let queryString = `
  SELECT p.*, AVG(pr.rating) AS average_rating 
  FROM properties AS p
  JOIN property_reviews AS pr ON p.id = pr.property_id `;

  // if user adds search criteria then it's added to the value arr and sql query
  if (options.city) {
    valuesArray.push(`%${options.city}%`);
    queryString += queryConstructor(valuesArray) + ` p.city LIKE $${valuesArray.length} `;
  }

  if (options.owner_id) {
    valuesArray.push(options.owner_id);
    queryString += queryConstructor(valuesArray) + ` p.owner_id = $${valuesArray.length}`;
  }

  if (options.minimum_price_per_night) {
    valuesArray.push(options.minimum_price_per_night * 100);
    queryString += queryConstructor(valuesArray) + ` p.cost_per_night >= $${valuesArray.length} `;
  }
  
  if (options.maximum_price_per_night) {
    valuesArray.push(options.maximum_price_per_night * 100);
    queryString += queryConstructor(valuesArray) + ` p.cost_per_night <= $${valuesArray.length} `;
  }

  
  queryString += `
  GROUP BY p.id, pr.rating`
  
  if (options.minimum_rating) {
    valuesArray.push(options.minimum_rating);
    queryString += ` HAVING pr.rating >= $${valuesArray.length} `;
  }
  valuesArray.push(limit);
  queryString += `
  ORDER BY p.cost_per_night
  LIMIT $${valuesArray.length};
  `;

  console.log(queryString, valuesArray); 

  return pool
    .query(queryString, valuesArray)
    .then((result) => result.rows)
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyKeys = Object.keys(property).toString();
  const queryParams = Object.values(property);
  const length = queryParams.length+1;
  const queryTokens = Array.from({length: length}, (v, i) => '$'+ i);
  queryTokens.shift().toString;

  const queryString = `
  INSERT INTO properties (${propertyKeys}) VALUES (${queryTokens}) RETURNING *`;

  return pool
  .query(queryString, queryParams)
  .then(res => res.rows[0])
  .catch((err) => {
    console.log(err.message);
  })

}
exports.addProperty = addProperty;