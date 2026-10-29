const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Токен недействителен или просрочен' });
  }
}
}


function requireRole(...roles) {
  return (req, res, next) => {
    // Если у пользователя роль 'admin', пропускаем сразу независимо от списка
    if (req.user.role === 'admin') {
      return next();
    }

    // Иначе проверяем, входит ли его роль в разрешенный список
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    next();
  };
}

module.exports = { auth, requireRole };