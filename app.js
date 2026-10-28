require('dotenv').config();
const express = require('express');
const { pool } = require('./db');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  await pool.query('select 1');
  res.json({ status: 'ok' });
});

app.get('/users', async (req, res) => {
  const dbRes = await pool.query(
    'select id_users, name, last_name, middle_name from Users'
  )
  console.log(dbRes.rows)
  res.send(dbRes.rows)
})


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
      console.log('Роль teacher не найдена');
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
  const { email, password } = req.body
  if (!email || !password) {
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
    const dbRes = await pool.query (
      'select 1 from users where email = $1 and password_hash = $2',
      [email, password_hash]
    )
  } catch {}
})

const port = Number(process.env.PORT);
app.listen(port, () => {
  console.log(`http://localhost:${port}/`);
});
