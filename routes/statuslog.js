const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'select ID_StatusLog as "idStatusLog", Created_at as "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", OldStatus_ID as "oldStatusId", NewStatus_ID as "newStatusId" from StatusLog'
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
     'select ID_StatusLog as "idStatusLog", Created_at as "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", OldStatus_ID as "oldStatusId", NewStatus_ID as "newStatusId" from StatusLog where ID_StatusLog = $1',
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
    const oldStatusId = Number(req.body.oldStatusId);
    const newStatusId = Number(req.body.newStatusId);
    const usersId = req.user.id;

  if (!Number.isInteger(equipmentId) || equipmentId < 1) {
    return res.status(400).json({ error: 'Некорректный ID оборудования' });
  }
  if (!Number.isInteger(oldStatusId) || oldStatusId < 1) {
    return res.status(400).json({ error: 'Некорректный ID старого статуса' });
  }
  if (!Number.isInteger(newStatusId) || newStatusId < 1) {
    return res.status(400).json({ error: 'Некорректный ID нового статуса' });
  }
   try {
     const result = await pool.query(
      `insert into StatusLog (Equipment_ID, Users_ID, OldStatus_ID, NewStatus_ID) values ($1, $2, $3, $4)
       returning ID_StatusLog as "idStatusLog", Created_at as "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", OldStatus_ID as "oldStatusId", NewStatus_ID as "newStatusId"`,
      [equipmentId, usersId, oldStatusId, newStatusId]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
        return res.status(400).json({ error: 'Указанного оборудования/статуса не существует' })
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }

  }
)


module.exports = router;