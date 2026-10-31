const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdParam, validateBody, validateIdsBody } = require('../middleware/validator');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'select ID_Equipment as "idEquimpent", Name, Inventory_number as "inventoryNumber", Photo_url as "photoUrl", Created_at as "createdAt", Status_ID as "statusId", Category_ID as "categoryId", Location_ID as "locationId" from Equipment'
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
            `select ID_Equipment as "idEquimpent", Name, Inventory_number as "inventoryNumber", Photo_url as "photoUrl", Created_at as "createdAt", Status_ID as "statusId", Category_ID as "categoryId", Location_ID as "locationId" from Equipment
     where id_equipment = $1`,
            [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Оборудование не найдено' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.post('/', auth, requireRole(), validateBody(['name', 'inventoryNumber', 'photoUrl']), validateIdsBody(['statusId', 'categoryId', 'locationId']), async (req, res) => {
    const { name, inventoryNumber, photoUrl, statusId, categoryId, locationId } = req.body;
    try {
        const result = await pool.query(
            `insert into Equipment (Name, Inventory_number, Photo_url, Status_ID, Category_ID, Location_ID) values ($1, $2, $3, $4, $5, $6)
       returning  ID_Equipment as "idEquimpent", Name, Inventory_number as "inventoryNumber", Photo_url as "photoUrl", Created_at as "createdAt", Status_ID as "statusId", Category_ID as "categoryId", Location_ID as "locationId"`,
            [name, inventoryNumber, photoUrl, statusId, categoryId, locationId]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Указанного статуса/категории/локации не существует' })
        }
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }

}
)

router.put('/:id', auth, requireRole(), validateIdParam('id'), validateBody(['name', 'inventoryNumber', 'photoUrl']), validateIdsBody(['statusId', 'categoryId', 'locationId']), async (req, res) => {
    const { id } = req.params;
    const { name, inventoryNumber, photoUrl, statusId, categoryId, locationId } = req.body;
    try {
        const result = await pool.query(
            `update Equipment set Name = $1, Inventory_number = $2, Photo_url = $3, Status_ID = $4, Category_ID = $5, Location_ID = $6 where ID_Equipment = $7 
            returning  ID_Equipment as "idEquimpent", Name, Inventory_number as "inventoryNumber", Photo_url as "photoUrl", Created_at as "createdAt", Status_ID as "statusId", Category_ID as "categoryId", Location_ID as "locationId"`,
            [name, inventoryNumber, photoUrl, statusId, categoryId, locationId, id]
        )
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Оборудование не найдено' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Оборудование с таким номером уже существует' });
        }
        console.log(err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
})


module.exports = router;