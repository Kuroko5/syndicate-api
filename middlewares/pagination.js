const debug = require('debug');
const log = {
  info: debug('pagination:info'),
  error: debug('pagination:error'),
  debug: debug('pagination:debug')
};

/**
 * Middleware to check query param (pagination)
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
const validator = (req, res, next) => {
  const { page, limit, sort, column } = req.query;
  // Define differents regex to check query param
  const regexPagination = /^[1-9]\d*/;
  const regexSort = /^-?1/;
  const regexColumn = /^[a-z]+/;

  // Verify if query param is missing
  if ((sort && !column) || (!sort && column)) {
    log.error('[paginationMiddleware] -> Missing query');
    return res.sendStatus(400);
  }

  // Default values for page & limit
  const currentPage = page || 1;
  const currentLimit = limit || 5;

  // Check if page and limit param are compliant
  const check =
    regexPagination.test(currentPage) && regexPagination.test(currentLimit);
  if (!check) {
    log.error('[paginationMiddleware] -> Wrong query page-limit');
    return res.sendStatus(400);
  }
  if (sort) {
    // Check if sort and column are compliant
    const checkSorting = regexSort.test(sort) && regexColumn.test(column);
    if (checkSorting) {
      // If all is right
      return next();
    } else {
      log.error('[paginationMiddleware] -> Wrong query sort-column');
      return res.sendStatus(400);
    }
  }
  return next();
};
module.exports = {
  validator
};
