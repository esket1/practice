const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'select ID_LocationLog as "idLocationLog", Created_at as "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", OldLocation_ID as "oldLocationId", NewLocation_ID as "newLocationId" from LocationLog'
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
     'select ID_LocationLog as "idLocationLog", Created_at as "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", OldLocation_ID as "oldLocationId", NewLocation_ID as "newLocationId" from LocationLog where ID_LocationLog = $1',
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
    const equipmentId = Number(req.body.equipmentId);
    const oldLocationId = Number(req.body.oldLocationId);
    const newLocationId = Number(req.body.newLocationId);
    const usersId = req.user.id;

  if (!Number.isInteger(equipmentId) || equipmentId < 1) {
    return res.status(400).json({ error: 'Некорректный ID оборудования' });
  }
  if (!Number.isInteger(oldLocationId) || oldLocationId < 1) {
    return res.status(400).json({ error: 'Некорректный ID старой локации' });
  }
  if (!Number.isInteger(newLocationId) || newLocationId < 1) {
    return res.status(400).json({ error: 'Некорректный ID новой локации' });
  }
   try {
     const result = await pool.query(
      `insert into LocationLog (Equipment_ID, Users_ID, OldLocation_ID, NewLocation_ID) values ($1, $2, $3, $4)
       returning ID_LocationLog as "idLocationLog", Created_at as "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", OldLocation_ID as "oldLocationId", NewLocation_ID as "newLocationId"`,
      [equipmentId, usersId, oldLocationId, newLocationId]
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