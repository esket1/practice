const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'select id_userblock as "idUserBlock", reason, blocked_at as "blockedAt", users_id as "usersId", blocked_by_id as "blockedById" from userblock'
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
      'select id_userblock as "idUserBlock", reason, blocked_at as "blockedAt", users_id as "usersId", blocked_by_id as "blockedById" from userblock where id_userblock = $1',
        [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Блокировка не найдена' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/', auth, requireRole(), async (req, res) => {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    const usersId = Number(req.body.usersId);
    const blockedById = req.user.id
  if (!Number.isInteger(usersId) || usersId < 1) {
    return res.status(400).json({ error: 'Некорректный id блокируемого пользователя' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'Заполните все обязательные поля'})
  }
   try {
     const result = await pool.query(
      `insert into userblock (reason, users_id, blocked_by_id) values ($1, $2, $3)
      returning id_userblock as "idUserBlock", reason, blocked_at as "blockedAt", users_id as "usersId", blocked_by_id as "blockedById"`,
      [reason, usersId, blockedById]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (err) {
      if (err.code === '23503') {
      return res.status(400).json({ error: 'Указанного пользователя не существует' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }

  }
)


module.exports = router;