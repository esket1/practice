const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('select id_location, name, type from location order by id_location');
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
    const result = await pool.query('select id_location, name, type from location where id_location = $1', 
        [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Локация не найдена' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/', auth, requireRole(), async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const type = typeof req.body.type === 'string' ? req.body.type.trim() : '';
  if (!name || !type) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  try {
     const result = await pool.query(
      'insert into location (name, type) values ($1, $2) returning id_location, name, type',
      [name, type]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Локация с таким названием уже существует' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }

  }
)

router.delete('/:id', auth, requireRole(), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Некорректный id' });
  }
  try {
    const result = await pool.query(
      'delete from location where id_location = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Локация не найдена' });
    }
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Локацию удалить нельзя, существует оборудование с этой локацией' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
   return res.status(200).json({ success: true, deleted_id: id });
})

router.put('/:id', auth, requireRole(), async (req, res) => {
    const id = Number(req.params.id);
    const newName = typeof req.body.newName === 'string' ? req.body.newName.trim() : '';
    const newType = typeof req.body.newType === 'string' ? req.body.newType.trim() : '';
    if (!newName || !newType ) {
        return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Некорректный id' });
     }
    try {
        const result = await pool.query(
            'update location set name = $1, type = $2 where id_location = $3',
            [newName, newType, id]
        )
        if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Локация не найдена' });
        }
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Название уже существует и не является уникальным' });
        }
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
    return res.status(200).json({ success: true, id, newName, newType });
})

module.exports = router;