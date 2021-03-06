const { ValidationError, RecordNotFoundError } = require('../error-types');
const db = require('../db');
const argon2 = require('argon2');

const findOne = async (id, failIfNotFound = true) => {
  const rows = await db.query(`SELECT * FROM users WHERE id = ?`, [id]);
  if (rows.length) {
    return rows[0];
  }
  if (failIfNotFound) throw new RecordNotFoundError('users', id);
  return null;
};

const emailAlreadyExists = async (email) => {
  const rows = await db.query(`SELECT * FROM users WHERE email = ?`, [email]);
  if (rows.length) {
    return true;
  }
  return false;
};

const validate = async (attributes) => {
  const { password, password_confirmation, email } = attributes;
  if (password && password_confirmation) {
    if (password === password_confirmation) {
      return !(await emailAlreadyExists(email));
    }
  }
  throw new ValidationError();
};

const hashPassword = async (user) => argon2.hash(user.password);

const create = async (newAttributes) => {
  await validate(newAttributes);
  const { email } = newAttributes;
  const encrypted_password = await hashPassword(newAttributes);
  return db.query(
    'INSERT INTO users (email, encrypted_password) VALUES (?, ?)',
    [email, encrypted_password]
  );
};

const verifyPassword = async (user, plainPassword) => {
  return argon2.verify(user.encrypted_password, plainPassword);
};

module.exports = {
  validate,
  create,
  emailAlreadyExists,
  findOne,
  hashPassword,
  verifyPassword,
};
