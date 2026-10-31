const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'select ID_Assignment as "idAssignment", due_At as "dueAt", Created_at as a "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", Issued_by_ID as "issuedById" from Assignment'
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
            `ID_Assignment as "idAssignment", due_At as "dueAt", Created_at as a "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", Issued_by_ID as "issuedById" from Assignment
     where ID_Assignment = $1`,
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
    const dueAt = req.body.dueAt;
    const equipmentId = Number(req.body.equipmentId);
    const usersId = Number(req.body.usersId);
    const issuedById = Number(req.body.issuedById);

    if (!dueAt) {
        return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }
    if (!Number.isInteger(equipmentId) || equipmentId < 1) {
        return res.status(400).json({ error: 'Некорректный ID оборудования' });
    }
    if (!Number.isInteger(usersId) || usersId < 1) {
        return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }
    if (!Number.isInteger(issuedById) || issuedById < 1) {
        return res.status(400).json({ error: 'Некорректный ID выдавшего' });
    }

    try {
        const result = await pool.query(
            `insert into Assignment (due_At, Equipment_ID, Users_ID, Issued_by_ID) values ($1, $2, $3, $4)
       returning ID_Assignment as "idAssignment", due_At as "dueAt", Created_at as "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", Issued_by_ID as "issuedById"`,
            [dueAt, equipmentId, usersId, issuedById]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Указанного оборудования/пользователя/выдавшего не существует' })
        }
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }

}
)

router.put('/:id', auth, requireRole(), async (req, res) => {
    const id = req.user.id
    const dueAt = req.body.dueAt;
    const equipmentId = Number(req.body.equipmentId);
    const usersId = Number(req.body.usersId);
    const issuedById = Number(req.body.issuedById);

    if (!dueAt) {
        return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }
    if (!Number.isInteger(equipmentId) || equipmentId < 1) {
        return res.status(400).json({ error: 'Некорректный ID оборудования' });
    }
    if (!Number.isInteger(usersId) || usersId < 1) {
        return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }
    if (!Number.isInteger(issuedById) || issuedById < 1) {
        return res.status(400).json({ error: 'Некорректный ID выдавшего' });
    }

    try {
        const result = await pool.query(
            `update Assignment set due_At = $1, Equipment_ID = $2, Users_ID = $3, Issued_by_ID = $4 where ID_Assignment = $5
       returning ID_Assignment as "idAssignment", due_At as "dueAt", Created_at as "createdAt", Equipment_ID as "equipmentId", Users_ID as "usersId", Issued_by_ID as "issuedById"`,
            [dueAt, equipmentId, usersId, issuedById, id]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Указанного оборудования/пользователя/выдавшего не существует' })
        }
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
})


module.exports = router;