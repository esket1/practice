const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdParam, validateIdsBody, validateBody } = require('../middleware/validator');

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

router.get('/:id', auth, validateIdParam('id'), async (req, res) => {
  const { id } = req.params;
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

router.post('/', auth, requireRole(), validateIdsBody(['usersId']), validateBody('reason'), async (req, res) => {
  const { id } = req.user;
  const { reason, usersId } = req.body;
  try {
    const result = await pool.query(
      `insert into userblock (reason, users_id, blocked_by_id) values ($1, $2, $3)
      returning id_userblock as "idUserBlock", reason, blocked_at as "blockedAt", users_id as "usersId", blocked_by_id as "blockedById"`,
      [reason, usersId, id]
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