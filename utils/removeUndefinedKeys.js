const removeUndefinedKeys = (obj) => {
  const newObj = {};

  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });

  return newObj;
};

module.exports = removeUndefinedKeys;
