const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

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

router.get('/:id', auth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Некорректный id' });
    }
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

router.post('/', auth, requireRole(), async (req, res) => {
    const assignmentId = Number(req.body.assignmentId);
    const usersId = Number(req.body.usersId);

    if (!Number.isInteger(assignmentId) || assignmentId < 1) {
        return res.status(400).json({ error: 'Некорректный ID выдачи' });
    }
    if (!Number.isInteger(usersId) || usersId < 1) {
        return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }

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