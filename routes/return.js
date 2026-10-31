const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdParam, validateBody, validateIdsBody } = require('../middleware/validator');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'select ID_Return as "idReturn", Created_at as "returnDate", Assignment_ID as "assignmentId", Users_ID as "usersId" from Return'
        );
        return res.status(200).json({ items: result.rows });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.get('/:id', auth, validateIdParam('id'), async (req, res) => {
    const {id} = req.params;
    try {
        const result = await pool.query(
            `select ID_Return as "idReturn", Created_at as "returnDate", Assignment_ID as "assignmentId", Users_ID as "usersId" from Return
     where ID_Return = $1`,
            [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Выдача не найдена' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.post('/', auth, requireRole(), validateIdsBody(['assignmentId', 'usersId']), async (req, res) => {
    const {assignmentId, usersId} = req.body;
    try {
        const result = await pool.query(
            `insert into Return (Assignment_ID, Users_ID) values ($1, $2)
       returning ID_Return as "idReturn", Created_at as "returnDate", Assignment_ID as "assignmentId", Users_ID as "usersId"`,
            [assignmentId, usersId]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Указанная выдача/пользователь не существует' })
        }
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }

}
)

module.exports = router;