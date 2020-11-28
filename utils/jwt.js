const jwtDecode = require('jwt-decode');

/**
 * decode token
 * @param token
 */
exports.jwtTokenDecode = token => {
  const regex = new RegExp('^Bearer ');
  let tok = token;
  if (regex.test(tok)) {
    // Remove 'Bearer '
    tok = tok.replace('Bearer ', '');
  }

  return jwtDecode(tok);
};
