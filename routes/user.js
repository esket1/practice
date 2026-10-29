const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'select id_users, email, u.name, last_name, middle_name, r.name as role from users u inner join role r on role_id = id_role order by id_users'
    );
    return res.status(200).json({ items: result.rows });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Некорректный id' });
  }
  try {
    const result = await pool.query(
      'select id_users, email, u.name, last_name, middle_name, r.name as role from users u inner join role r on role_id = id_role where id_users = $1 order by id_users',
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

router.put('/:id', auth, requireRole(), async (req, res) => {
  const id = Number(req.params.id);
  const newEmail = typeof req.body.newEmail === 'string' ? req.body.newEmail.trim() : '';
  const newName = typeof req.body.newName === 'string' ? req.body.newName.trim() : '';
  const NewLast_Name = typeof req.body.NewLast_Name === 'string' ? req.body.NewLast_Name.trim() : '';
  const NewMiddle_Name = NewMiddle_Name ? NewMiddle_Name : null
  const NewRole_id = Number(req.body.NewRole_id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Некорректный id' });
  }
  if (!Number.isInteger(NewRole_id) || NewRole_id < 1) {
    return res.status(400).json({ error: 'Некорректный id роли' });
  }
  if (!newEmail || !newName || !NewLast_Name || !NewRole_id) {
    return res.status(400).json({ error: 'Заполните все обязательные поля'})
  }
  try {
    const result = await pool.query(
      'update users set email = $1, name = $2, last_name = $3, middle_name = $4, role_id = $5 where id_users = $6',
      [newEmail, newName, NewLast_Name, NewMiddle_Name, NewRole_id, id]
    )
    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
        }
  } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Почта уже существует и не является уникальным' });
        }
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
    return res.status(200).json({ success: true, id, newEmail, newName, NewLast_Name, NewMiddle_Name, NewRole_id });
})

module.exports = router;