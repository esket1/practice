const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdParam, validateBody } = require('../middleware/validator');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('select id_location as "idLocation", name, type from location order by id_location');
    return res.status(200).json({ items: result.rows });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/:id', auth, validateIdParam('id'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('select id_location as "idLocation", name, type from location where id_location = $1', 
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

router.post('/', auth, requireRole(), validateBody(['name', 'type']), async (req, res) => {
  const { name, type } = req.body;
  try {
     const result = await pool.query(
      `insert into location (name, type) values ($1, $2)
      returning id_location as "idLocation", name, type`,
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

router.delete('/:id', auth, requireRole(), validateIdParam('id'), async (req, res) => {
  const { id } = req.params;
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
   return res.status(200).json({ success: true, deletedId: id });
})

router.put('/:id', auth, requireRole(), validateIdParam('id'), validateBody(['name', 'type']), async (req, res) => {
    const { id } = req.params;
    const { name, type } = req.body;
    try {
        const result = await pool.query(
            `update location set name = $1, type = $2 where id_location = $3
            returning id_location as "idLocation", name, type`,
            [name, type, id]
        )
        if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Локация не найдена' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Локация с таким названием уже существует' });
        }
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
})

module.exports = router;