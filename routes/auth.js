const express = require('express');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();


// нужен, чтобы время ответа не выдавало, существует ли email
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

app.post('/auth/register', async (req, res) => {
  const { email, password, name, last_name } = req.body;
  const middle_name = req.body.middle_name || null;

  if (!email || !password || !name || !last_name) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Некорректный формат данных' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 8 символов' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Некорректный email' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const roleRes = await pool.query(
      'select id_role from role where name = $1',
      ['admin']
    );
    if (roleRes.rows.length === 0) {
      console.log('Роль admin не найдена');
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }

    await pool.query(
      'insert into users (email, password_hash, name, last_name, middle_name, role_id) values ($1, $2, $3, $4, $5, $6)',
      [email.toLowerCase(), password_hash, name, last_name, middle_name, roleRes.rows[0].id_role]
    );

    return res.status(201).json({ email: email.toLowerCase(), name, last_name });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email уже занят' });
    }
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Некорректный формат данных' });
  }

  try {
    const userRes = await pool.query(
      `select id_users, password_hash, r.name as role
      from users join role r on id_role = role_id
      where lower(email) = $1`,
      [email.toLowerCase()]
    );
    const user = userRes.rows[0];

    const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !ok) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const blockRes = await pool.query(
      `select 1 from userblock b
      left join userunblock ub on userblock_id = id_userunblock
      where b.users_id = $1 and id_userunblock is null`,
      [user.id_users]
    );
    if (blockRes.rows.length > 0) {
      return res.status(403).json({ error: 'Пользователь заблокирован' });
    }

    const access_token = jwt.sign(
      { id: user.id_users, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
    );
    const refresh_token = jwt.sign(
      { id: user.id_users, jti: crypto.randomUUID() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    const token_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    const expires_at = new Date(jwt.decode(refresh_token).exp * 1000);

    await pool.query(
      'insert into refreshtoken (users_id, token_hash, expires_at) values ($1, $2, $3)',
      [user.id_users, token_hash, expires_at]
    );

    return res.status(200).json({ access_token, refresh_token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Эндпоинт обновления токенов с ротацией
app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body || {};
  if (!refresh_token || typeof refresh_token !== 'string') {
    return res.status(400).json({ error: 'Требуется refresh token' });
  }

  try {
    jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

    const token_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');

    const tokenRes = await pool.query(
      `select id_refreshtoken, users_id from refreshtoken 
       where token_hash = $1 and expires_at > now()`,
      [token_hash]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token недействителен или отозван' });
    }

    const userId = tokenRes.rows[0].users_id;

    const userRes = await pool.query(
      `select id_users, r.name as role
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
       left join userunblock ub on userblock_id = id_userunblock
       where b.users_id = $1 and id_userunblock is null`,
      [userId]
    );
    if (blockRes.rows.length > 0) {
      return res.status(403).json({ error: 'Пользователь заблокирован' });
    }

    // Удаляем старый refresh-токен (ротация)
    await pool.query('delete from refreshtoken where id_refreshtoken = $1', [tokenRes.rows[0].id_refreshtoken]);

    // Генерируем новую пару
    const new_access_token = jwt.sign(
      { id: user.id_users, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
    );
    const new_refresh_token = jwt.sign(
      { id: user.id_users, jti: crypto.randomUUID() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    const new_token_hash = crypto.createHash('sha256').update(new_refresh_token).digest('hex');
    const new_expires_at = new Date(jwt.decode(new_refresh_token).exp * 1000);

    await pool.query(
      'insert into refreshtoken (users_id, token_hash, expires_at) values ($1, $2, $3)',
      [user.id_users, new_token_hash, new_expires_at]
    );

    return res.status(200).json({
      access_token: new_access_token,
      refresh_token: new_refresh_token
    });

  } catch (err) {
    console.log(err);
    return res.status(401).json({ error: 'Недействительный refresh token' });
  }
});

module.exports = router;