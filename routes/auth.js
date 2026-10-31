const express = require('express');
const { pool } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const router = express.Router();

const dummyHash = bcrypt.hashSync('dummy-password', 10);

router.post('/register', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const lastName = typeof req.body.lastName === 'string' ? req.body.lastName.trim() : '';
  const roleId = Number(req.body.roleId);
  const middleName =
    typeof req.body.middleName === 'string' && req.body.middleName.trim()
      ? req.body.middleName.trim()
      : null;

  if (!email || !password || !name || !lastName || !roleId) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 8 символов' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Некорректный email' });
  }
  if (!Number.isInteger(roleId) || roleId < 1) {
    return res.status(400).json({ error: 'Некорректный id роли' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `insert into users (email, password_hash, name, last_name, middle_name, role_id)
       values ($1, $2, $3, $4, $5, $6)
       returning id_users as "idUsers", email, name, last_name as "lastName",
                 middle_name as "middleName", role_id as "roleId"`,
      [email.toLowerCase(), passwordHash, name, lastName, middleName, roleId]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email уже занят' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Указанной роли не существует' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';
  if (!email || !password) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  try {
    const result = await pool.query(
      `select id_users as "idUsers", password_hash as "passwordHash", r.name as role
       from users join role r on id_role = role_id
       where lower(email) = $1`,
      [email.toLowerCase()]
    );
    const user = result.rows[0];

    const ok = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
    if (!user || !ok) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const blockRes = await pool.query(
      `select 1 from userblock b
       left join userunblock ub on ub.userblock_id = b.id_userblock
       where b.users_id = $1 and ub.id_userunblock is null`,
      [user.idUsers]
    );
    if (blockRes.rows.length > 0) {
      return res.status(403).json({ error: 'Пользователь заблокирован' });
    }

    const accessToken = jwt.sign(
      { id: user.idUsers, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );
    const refreshToken = jwt.sign(
      { id: user.idUsers, jti: crypto.randomUUID() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(jwt.decode(refreshToken).exp * 1000);

    await pool.query(
      'insert into refreshtoken (users_id, token_hash, expires_at) values ($1, $2, $3)',
      [user.idUsers, tokenHash, expiresAt]
    );

    return res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ error: 'Требуется refresh token' });
  }

  try {
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: 'Недействительный refresh token' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const tokenRes = await pool.query(
      `select id_refreshtoken, users_id from refreshtoken
       where token_hash = $1 and expires_at > now()`,
      [tokenHash]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token недействителен или отозван' });
    }

    const userId = tokenRes.rows[0].users_id;

    const userRes = await pool.query(
      `select id_users as "idUsers", r.name as role
       from users join role r on id_role = role_id
       where id_users = $1`,
      [userId]
    );
    const user = userRes.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const blockRes = await pool.query(
      `select 1 from userblock b
       left join userunblock ub on ub.userblock_id = b.id_userblock
       where b.users_id = $1 and ub.id_userunblock is null`,
      [userId]
    );
    if (blockRes.rows.length > 0) {
      return res.status(403).json({ error: 'Пользователь заблокирован' });
    }

    await pool.query(
      'delete from refreshtoken where id_refreshtoken = $1',
      [tokenRes.rows[0].id_refreshtoken]
    );

    const newAccessToken = jwt.sign(
      { id: user.idUsers, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );
    const newRefreshToken = jwt.sign(
      { id: user.idUsers, jti: crypto.randomUUID() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const newExpiresAt = new Date(jwt.decode(newRefreshToken).exp * 1000);

    await pool.query(
      'insert into refreshtoken (users_id, token_hash, expires_at) values ($1, $2, $3)',
      [user.idUsers, newTokenHash, newExpiresAt]
    );

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;