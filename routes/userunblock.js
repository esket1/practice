const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'select id_userunblock as "idUserUnblock", reason, unblocked_at as "unblockedAt", userblock_id as "userBlockId", users_id as "usersId" from userunblock'
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
      'select id_userunblock as "idUserUnblock", reason, unblocked_at as "unblockedAt", userblock_id as "userBlockId", users_id as "usersId" from userunblock where id_userunblock = $1',
        [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Разблокировка не найдена' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/', auth, requireRole(), async (req, res) => {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    const userBlockId = Number(req.body.userBlockId);
    const usersId = req.user.id
  if (!Number.isInteger(userBlockId) || userBlockId < 1) {
    return res.status(400).json({ error: 'Некорректный ID блокировки' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'Заполните все обязательные поля'})
  }
   try {
     const result = await pool.query(
      `insert into userunblock (reason, UserBlock_ID, Users_ID) values ($1, $2, $3) 
      returning id_userunblock as "idUserUnblock", reason, unblocked_at as "unblockedAt", userblock_id as "userBlockId", users_id as "usersId"`,
      [reason, userBlockId, usersId]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
        return res.status(400).json({ error: 'Указанной блокировки не существует' })
    }
    if (err.code === '23505') {
        return res.status(400).json({ error: 'Эта блокировка уже разблокирована' })
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }

  }
)


module.exports = router;