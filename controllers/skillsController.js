const skillsService = require('../services/skillsService');
const jwtDecode = require('jwt-decode');

/**
 * Get all skills and status.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const getSkills = async (req, res, next) => {
  const skills = [];
  try {
    const [, body] = await skillsService.getAllSkills();
    const data = JSON.parse(body);
    if (data) {
      const [, body] = await skillsService.getStatus();
      const status = JSON.parse(body);
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < status.length; j++) {
          if (data[i]._id === status[j].id) {
            const newObjet = {
              _id: data[i]._id,
              descr: data[i].descr,
              dId: data[i].dId,
              consequences: data[i].consequences,
              actions: [...data[i].actions],
              startedAt: status[j].startedAt,
              endedAt: status[j].endedAt,
              active: status[j].active
            };
            skills.push(newObjet);
          }
        }
      }
    }
    return res.status(200).send({ skills });
  } catch (e) {
    next(e);
  }
};

/**
 * Start one skill.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const startSkills = async (req, res, next) => {
  try {
    // Get the id of the skill.
    const idSkill = req.body.idSkill;

    // Decode the token to get the operator.
    const token = req.headers.authorization;
    const decodeJwt = jwtDecode(token);
    const username = decodeJwt.username;

    const [, body] = await skillsService.startOneSkill(idSkill, username);
    const data = JSON.parse(body);

    return res.status(200).send({ data });
  } catch (e) {
    next(e);
  }
};

/**
 * Stop one skill.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const stopSkills = async (req, res, next) => {
  try {
    // Get the id of the skill.
    const idSkill = req.body.idSkill;

    // Decode the token to get the operator.
    const token = req.headers.authorization;
    const decodeJwt = jwtDecode(token);
    const username = decodeJwt.username;

    const [, body] = await skillsService.stopOneSkill(idSkill, username);
    const data = JSON.parse(body);

    return res.status(200).send({ data });
  } catch (e) {
    next(e);
  }
};

module.exports = { getSkills, startSkills, stopSkills };
