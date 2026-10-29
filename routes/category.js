const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('select id_category, name from category order by id_category');
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
    const result = await pool.query('select id_category, name from category where id_category = $1', 
        [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/', auth, requireRole(), async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  try {
     const result = await pool.query(
      'insert into category (name) values ($1) returning id_category, name',
      [name]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Категория с таким названием уже существует' });
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
      'delete from category where id_category = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Категорию удалить нельзя, существует оборудование с этой категорией' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
   return res.status(200).json({ success: true, deleted_id: id });
})

router.put('/:id', auth, requireRole(), async (req, res) => {
  const id = Number(req.params.id);
  const newName = typeof req.body.newName === 'string' ? req.body.newName.trim() : '';
  if (!newName) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Некорректный id' });
  }
  try {
    const result = await pool.query(
      'update category set name = $1 where id_category = $2',
      [newName, id]
    )
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Категория не найдена' });
      }
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Название уже существует и не является уникальным' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
   return res.status(200).json({ success: true, id, newName });
})

module.exports = router;