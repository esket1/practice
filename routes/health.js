router.get('/health', async (req, res) => {
  await pool.query('select 1');
  res.json({ status: 'ok' });
});