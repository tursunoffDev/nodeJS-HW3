const { SHIPPER, DRIVER } = require('../../constants/userRoles');
const loadService = require('../../service/LoadService');
const express = require('express');
const {
  USER_LACKS_AUTHORITY,
  WRONG_ID_FORMAT,
} = require('../../constants/errors');
const requireRole = require('../middleware/requireUserRole');
const validateGetLoads = require('../validation/load/getLoads');
const validateCreateOrEditLoad = require('../validation/load/validateCreateOrEditLoad');
const { isValidObjectId } = require('../../utils/isValidObjectId');
const HttpError = require('../../utils/HttpError');
const router = express.Router();
const {
  LOAD_STATE_CHANGED,
  LOAD_CREATED,
  SUCCESS,
  LOAD_POSTED,
  NO_DRIVERS_FOUND,
  LOAD_EDITED,
  LOAD_REMOVED,
} = require('../../constants/responseStatuses');

router.param('id', async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(new HttpError(400, WRONG_ID_FORMAT));
  }
  const shipper = req.user;

  try {
    req.load = await loadService.findById(id);
    if (!loadService.hasUserAuthorityForLoad(shipper, req.load)) {
      return res.status(400).json({ message: USER_LACKS_AUTHORITY });
    }
    next();
  } catch (err) {
    return next(err);
  }
});

router.get('/', validateGetLoads, async (req, res, next) => {
  const queryStatus = req.query.status;
  const status = queryStatus.toUpperCase();

  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const loadEntityList = await loadService.getLoadsForRole(req.user, status);
    const loadResponseDtoList =
      loadService.convertEntityListToResponseDtoList(loadEntityList);

    res.json({ loads: loadResponseDtoList });
  } catch (err) {
    next(err);
  }
});

router.get('/active', validateGetLoads, async (req, res, next) => {
  try {
    const loadEntityList = await loadService.getActiveLoads(req.user);
    const loadResponseDtoList =
      loadService.convertEntityListToResponseDtoList(loadEntityList);

    res.json({ loads: loadResponseDtoList });
  } catch (err) {
    next(err);
  }
});

router.patch('/active/state', requireRole(DRIVER), async (req, res, next) => {
  try {
    const loadEntityList = await loadService.getActiveLoads(req.user);
    const loads =
      loadService.convertEntityListToResponseDtoList(loadEntityList);

    if (loads) await loadService.performLoadStateChange(loads[0]);
    else throw new Error('no load found');

    res.json({ message: LOAD_STATE_CHANGED });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res) => {
  const loadResponseDto = loadService.convertLoadEntityToLoadResponseDto(
    req.load
  );

  res.json({ load: loadResponseDto });
});

router.post(
  '/',
  requireRole(SHIPPER),
  validateCreateOrEditLoad,
  async (req, res, next) => {
    const load = {
      ...req.body,
      createdBy: req.user._id,
    };

    try {
      await loadService.createLoad(load);
      res.json({ message: LOAD_CREATED });
    } catch (err) {
      console.log('error here');
      return next(err);
    }
  }
);

router.delete('/:id', async (req, res, next) => {
  try {
    await loadService.remove(req.load);
    res.json({ message: LOAD_REMOVED });
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', validateCreateOrEditLoad, async (req, res, next) => {
  const load = req.load;
  const editedLoadData = req.body;

  try {
    await loadService.update(load, editedLoadData);

    res.status(200).json({ message: LOAD_EDITED });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/post', requireRole(SHIPPER), async (req, res, next) => {
  const { id } = req.params;

  try {
    const postedLoad = await loadService.postLoadById(id);
    if (!!postedLoad.assignedTo) {
      return res.json({
        message: LOAD_POSTED,
        driver_found: true,
        assigned_to: postedLoad.assignedTo,
      });
    }

    res.json({ message: NO_DRIVERS_FOUND });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
