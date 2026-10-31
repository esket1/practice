const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdParam, validateBody } = require('../middleware/validator');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('select id_status as "idStatus", name, type from status');
    return res.status(200).json({ items: result.rows });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/:id', auth, validateIdParam('id'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('select id_status as "idStatus", name, type from status where id_status = $1',
      [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Статус не найдена' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/', auth, requireRole(), validateBody(['name', 'type']), async (req, res) => {
  const { name, type } = req.body;
  try {
    const result = await pool.query(
      'insert into status (name, type) values ($1, $2) returning id_status as "idStatus", name, type',
      [name, type]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Статус с таким названием уже существует' });
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
      'delete from status where id_status = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Статус не найден' });
    }
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Статус удалить нельзя, существует оборудование с этим статусом' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
  return res.status(200).json({ success: true, deleted_id: id });
})

router.put('/:id', auth, requireRole(), validateIdParam('id'), validateBody(['name', 'type']), async (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;
  try {
    const result = await pool.query(
      `update status set name = $1, type = $2 where id_status = $3
             returning id_status as "idStatus", name, type`,
      [name, type, id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Статус не найден' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Название уже существует и не является уникальным' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
})

module.exports = router;