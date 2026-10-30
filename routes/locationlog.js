const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'select ID_LocationLog, Created_at, Equipment_ID, Users_ID, OldLocation_ID, NewLocation_ID from LocationLog'
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
     'select ID_LocationLog, Created_at, Equipment_ID, Users_ID, OldLocation_ID, NewLocation_ID from LocationLog where ID_LocationLog = $1',
        [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Запись в логах локаций не найдена' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/', auth, requireRole(), async (req, res) => {
    const equipment_ID = Number(req.body.equipment_ID);
    const oldLocation_ID = Number(req.body.oldLocation_ID);
    const newLocation_ID = Number(req.body.newLocation_ID);
    const users_ID = req.user.id;

  if (!Number.isInteger(equipment_ID) || equipment_ID < 1) {
    return res.status(400).json({ error: 'Некорректный ID оборудования' });
  }
  if (!Number.isInteger(oldLocation_ID) || oldLocation_ID < 1) {
    return res.status(400).json({ error: 'Некорректный ID старой локации' });
  }
  if (!Number.isInteger(newLocation_ID) || newLocation_ID < 1) {
    return res.status(400).json({ error: 'Некорректный ID новой локации' });
  }
   try {
     const result = await pool.query(
      'insert into LocationLog (Equipment_ID, Users_ID, OldLocation_ID, NewLocation_ID) values ($1, $2, $3, $4) returning ID_LocationLog, Created_at, Equipment_ID, Users_ID, OldLocation_ID, NewLocation_ID',
      [equipment_ID, users_ID, oldLocation_ID, newLocation_ID]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
        return res.status(400).json({ error: 'Указанной локации и/или оборудования не существует' })
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }

  }
)


module.exports = router;