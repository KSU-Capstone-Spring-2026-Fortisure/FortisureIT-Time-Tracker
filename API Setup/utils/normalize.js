function normalize(value) {
  return value === "" || value === undefined ? null : value;
}

module.exports = { normalize };