const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdParam, validateIdsBody } = require('../middleware/validator');

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

router.get('/:id', auth, validateIdParam('id'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
     'select ID_StatusLog as "idStatusLog", Created_at as "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", OldStatus_ID as "oldStatusId", NewStatus_ID as "newStatusId" from StatusLog where ID_StatusLog = $1',
        [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Запись в логах статусов не найдена' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/', auth, requireRole(), validateIdsBody(['equipmentId', 'oldStatusId', 'newStatusId']), async (req, res) => {
    const { id } = req.user;
    const {equipmentId, oldStatusId, newStatusId} = req.body;
   try {
     const result = await pool.query(
      `insert into StatusLog (Equipment_ID, Users_ID, OldStatus_ID, NewStatus_ID) values ($1, $2, $3, $4)
       returning ID_StatusLog as "idStatusLog", Created_at as "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", OldStatus_ID as "oldStatusId", NewStatus_ID as "newStatusId"`,
      [equipmentId, id, oldStatusId, newStatusId]
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