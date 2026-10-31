function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateBody(requiredFields = []) {
  return (req, res, next) => {
    for (const field of requiredFields) {
      const value = normalizeString(req.body[field]);

      if (!value) {
        return res.status(400).json({ error: `Поле "${field}" обязательно` });
      }

      req.body[field] = value;
    }

    next();
  };
}

function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const rawValue = req.params[paramName];
    const value = Number(rawValue);

    if (!Number.isInteger(value) || value < 1) {
      return res.status(400).json({ error: `Некорректный ID ${paramName}` });
    }

    req.params[paramName] = value;
    next();
  };
}

function validateIdsBody(fieldNames, location = 'body') {
  const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

  return (req, res, next) => {
    const source = req.body;

    for (const fieldName of fields) {
      const value = Number(source[fieldName]);

      if (!Number.isInteger(value) || value < 1) {
        return res.status(400).json({ error: `Некорректный ID ${fieldName}` });
      }

      source[fieldName] = value;
    }

    next();
  };
}

function validateRequiredString(fieldName, location = 'body', customMessage) {
  return (req, res, next) => {
    const source = location === 'params' ? req.params : req.body;
    const value = normalizeString(source[fieldName]);

    if (!value) {
      return res.status(400).json({
        error: customMessage || `Поле "${fieldName}" обязательно`,
      });
    }

    source[fieldName] = value;
    next();
  };
}

function validateEmail(fieldName = 'email') {
  return (req, res, next) => {
    const value = normalizeString(req.body[fieldName]).toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(value)) {
      return res.status(400).json({ error: 'Некорректный email' });
    }

    req.body[fieldName] = value;
    next();
  };
}

function validatePassword(fieldName = 'password') {
  return (req, res, next) => {
    const value = normalizeString(req.body[fieldName]);

    if (value.length < 8) {
      return res.status(400).json({ error: 'Пароль должен быть не короче 8 символов' });
    }

    req.body[fieldName] = value;
    next();
  };
}

module.exports = {
  normalizeString,
  validateBody,
  validateIdParam,
  validateIdsBody,
  validateRequiredString,
  validateEmail,
  validatePassword,
};