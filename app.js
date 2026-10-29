require('dotenv').config();
const express = require('express');
const { pool } = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const roleRouter = require('./routes/role');
const categoryRouter = require('./routes/category');
const locationRouter = require('./routes/location');
const statusRouter = require('./routes/status');
const authRouter = require('./routes/auth');

const app = express();
app.use(express.json());
app.use('/role', roleRouter);
app.use('/category', categoryRouter);
app.use('/location', locationRouter);
app.use('/status', statusRouter);
app.use('/auth', authRouter);

const port = Number(process.env.PORT);
app.listen(port, () => {
  console.log(`http://localhost:${port}/`);
});