const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdParam, validateBody } = require('../middleware/validator');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('select id_category as "idCategory", name from category order by id_category');
    return res.status(200).json({ items: result.rows });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/:id', auth, validateIdParam('id'), async (req, res) => {
  const {id} = req.params;
  try {
    const result = await pool.query('select id_category as "idCategory", name from category where id_category = $1',
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

router.post('/', auth, requireRole(), validateBody(['name']), async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      `insert into category (name) values ($1)
       returning id_category as "idCategory", name`,
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

router.delete('/:id', auth, validateIdParam('id'), requireRole(), async (req, res) => {
  const { id } = req.params;
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

router.put('/:id', auth, requireRole(), validateIdParam('id'), validateBody(['name']), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      `update category set name = $1 where id_category = $2
      returning id_category as "idCategory", name`,
      [name, id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
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