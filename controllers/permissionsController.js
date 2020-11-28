require('dotenv-safe').config();
require('../passport-strategy');
const permissionsService = require('../services/permissionsService');
/**
 * Get all permissions.
 * @param {*} req
 * @param {*} res
 */
const getPermissions = async (req, res) => {
  const getAllPermissions = await permissionsService.allPermissions();

  if (getAllPermissions instanceof Error) {
    return res.status(404).send({ code: 404, message: getAllPermissions.message });
  }
  return res.status(200).send({ code: 200, data: getAllPermissions });
};

module.exports = {
  getPermissions
};
