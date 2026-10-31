require('dotenv').config();
const express = require('express');
// const { pool } = require('./db');

const roleRouter = require('./routes/role');
const categoryRouter = require('./routes/category');
const locationRouter = require('./routes/location');
const statusRouter = require('./routes/status');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const userBlockRouter = require('./routes/userblock')
const userUnblockRouter = require('./routes/userunblock')
const locationLogRouter = require('./routes/locationlog')
const statusLogRouter = require ('./routes/statuslog')
const equimpentRouter = require ('./routes/equipment')
const assignmentRounter = require ('./routes/assignment')
const returnRouter = require ('./routes/return')

const app = express();
app.use(express.json());
app.use('/role', roleRouter);
app.use('/category', categoryRouter);
app.use('/location', locationRouter);
app.use('/status', statusRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/userblock', userBlockRouter);
app.use('/userunblock', userUnblockRouter);
app.use('/locationlog', locationLogRouter);
app.use('/statuslog', statusLogRouter);
app.use('/equipment', equimpentRouter);
app.use('/assignment', assignmentRounter);
app.use('/return', returnRouter);


const port = Number(process.env.PORT);
app.listen(port, () => {
  console.log(`http://localhost:${port}/`);
});