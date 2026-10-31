const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdParam, validateBody } = require('../middleware/validator');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('select id_role as "idRole", name from role');
    return res.status(200).json({ items: result.rows });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/:id', auth, validateIdParam('id'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('select id_role as "idRole", name from role where id_role = $1',
      [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Роль не найдена' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/', auth, requireRole(), validateBody(['name']), async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'insert into role (name) values ($1) returning id_role as "idRole", name',
      [name]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Роль с таким названием уже существует' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }

}
)

router.delete('/:id', auth, requireRole(), validateIdParam('id'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'delete from role where id_role = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Роль не найдена' });
    }
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Роль удалить нельзя, существуют пользователи с этой ролью' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
  return res.status(200).json({ success: true, deletedIdd: id });
})

router.put('/:id', auth, requireRole(), validateIdParam('id'), validateBody(['name']), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      'update role set name = $1 where id_role = $2 returning id_role as "idRole", name',
      [name, id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Роль не найдена' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Роль с таким названием уже существует' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
})

module.exports = router;