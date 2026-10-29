// Поднимаемся на уровень выше к папке проекта, если файл лежит в utils/, 
// или пишем правильный путь до твоего файла подключения к базе
const { pool } = require('../db'); // Если файл лежит в папке utils/
// Или если положил в корень рядом с app.js, то: const { pool } = require('./db');

// 👉 Введи свой SQL-запрос прямо сюда:
const sql = 'select id_users, email, u.name, last_name, middle_name, r.name as role from users u inner join role r on role_id = id_role where id_users = $1 order by id_users';
// const sql = 'select * from role'
const params = [1];

async function run() {
  try {
    const result = await pool.query(sql, params);
    
    console.log('\n--- РЕЗУЛЬТАТ ---');
    console.table(result.rows);
    console.log(`Всего строк: ${result.rowCount}\n`);
  } catch (err) {
    console.error('\n❌ ОШИБКА:', err.message);
    if (err.code) console.error('Код ошибки БД:', err.code);
  } finally {
    // Закрываем пул соединений, чтобы скрипт завершился
    await pool.end();
  }
}

run();