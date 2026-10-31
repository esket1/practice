const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdParam, validateBody, validateEmail, validateIdsBody } = require('../middleware/validator');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'select id_users as "idUsers", email, name, last_name as "lastName", middle_name as "middleName", role_id as "roleId" from users'
    );
    return res.status(200).json({ items: result.rows });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/:id', auth, validateIdParam('id'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'select id_users as "idUsers", email, name, last_name as "lastName", middle_name as "middleName", role_id as "roleId" from users where id_users = $1',
      [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.put('/:id', auth, requireRole(), validateIdParam('id'), validateIdsBody('roleId'), validateBody(['email', 'name', 'lastName', 'middleName']), validateEmail(), async (req, res) => {
  const { id } = req.params;
  const { email, name, lastName, middleName, roleId } = req.body;
  try {
    const result = await pool.query(
      `update users set email = $1, name = $2, last_name = $3, middle_name = $4, role_id = $5 where id_users = $6
      returning id_users as "idUsers", email, name, last_name as "lastName", middle_name as "middleName", role_id as "roleId"`,
      [email, name, lastName, middleName, roleId, id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Почта уже существует и не является уникальной' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Указанной роли не существует' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
})

module.exports = router;