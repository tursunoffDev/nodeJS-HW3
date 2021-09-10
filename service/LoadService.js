const Load = require('../model/load.model');
const { NEW, POSTED, ASSIGNED, SHIPPED } = require('../constants/loadStatuses');
const truckService = require('./TruckService');
const driverService = require('./DriverService');
const Truck = require('../model/truck.model');
const { IS, OL } = require('../constants/truckStatuses');
const {
  USER_LACKS_AUTHORITY,
  LOAD_NOT_FOUND_BY_ID,
  CANNOT_EDIT_NOT_NEW_LOAD,
  CANNOT_POST_NOT_NEW_LOAD,
  CANNOT_CHANGE_ARRIVED_LOAD_STATE,
} = require('../constants/errors');
const { DRIVER, SHIPPER } = require('../constants/userRoles');
const {
  ROUTE_TO_PICK_UP,
  ARRIVED_TO_PICK_UP,
  ROUTE_TO_DELIVERY,
  ARRIVED_TO_DELIVERY,
} = require('../constants/loadStates');
const HttpError = require('../utils/HttpError');
const removeUndefinedKeys = require('../utils/removeUndefinedKeys');
const moment = require('moment');

class LoadService {
  findAll() {
    return Load.find();
  }

  findByCreatedUserId(userId, status) {
    return Load.find({
      createdBy: userId,
      status,
    });
  }

  async findById(id) {
    const foundLoad = await Load.findById(id);
    if (!foundLoad) {
      throw new HttpError(400, LOAD_NOT_FOUND_BY_ID);
    }

    return foundLoad;
  }

  async save(load) {
    const newLoad = await Load.create(load);
    return newLoad.addLog('Load created');
  }

  remove(load) {
    if (load.status !== NEW) {
      throw new HttpError(400, CANNOT_EDIT_NOT_NEW_LOAD);
    }

    return Load.findByIdAndDelete(load);
  }

  async update(load, editedLoadData) {
    if (load.status !== NEW) {
      throw new HttpError(400, CANNOT_EDIT_NOT_NEW_LOAD);
    }

    await Load.findByIdAndUpdate(load, editedLoadData);
    return this.findById(load);
  }

  updateLoadStatus(load, newStatus) {
    load.status = newStatus;
    return load.addLog(`Changed status to ${newStatus}`);
  }

  async connectTruckAndLoad(truck, load) {
    if (load.status === NEW) {
      await this.updateLoadStatus(load, POSTED);
    }

    await truck.update({ status: OL });
    const assignedDriverId = truck.assignedTo;

    await driverService.assignLoad(assignedDriverId, load._id);
    await this.updateLoadStatus(load, ASSIGNED);
    await this.performLoadStateChange(load, ROUTE_TO_PICK_UP);
  }
  async processPostedLoad(postedLoad) {
    const foundTruck = await truckService.findTruckForLoad(postedLoad);

    if (!foundTruck) {
      await this.updateLoadStatus(postedLoad, NEW);
    } else {
      await this.connectTruckAndLoad(foundTruck, postedLoad);
    }

    return Load.findById(postedLoad);
  }

  async createLoad(load) {
    const newLoad = await this.save(load);
    return this.updateLoadStatus(newLoad, NEW);
  }

  async postLoadById(loadId) {
    const load = await this.findById(loadId);

    if (load.status !== NEW) {
      throw new HttpError(400, CANNOT_POST_NOT_NEW_LOAD);
    }

    await this.updateLoadStatus(load, POSTED);
    return this.processPostedLoad(load);
  }

  async finishDelivery(load) {
    const updatedLoad = await this.updateLoadStatus(load, SHIPPED);

    const populatedLoad = await updatedLoad
      .populate('assignedTo')
      .execPopulate();
    const assignedDriver = populatedLoad.assignedTo;

    await assignedDriver.update({ $unset: { assignedLoad: 1 } });

    const truckId = assignedDriver.truck;

    await Truck.findByIdAndUpdate(truckId, { status: IS });
  }

  hasUserAuthorityForLoad(user, load) {
    switch (user.role) {
      case DRIVER:
        return load.equals(user.assignedLoad);
      case SHIPPER:
        return user.equals(load.createdBy);
      default:
        throw new HttpError(400, USER_LACKS_AUTHORITY);
    }
  }

  async performLoadStateChange(load) {
    const newState = this.getNextLoadState(load);

    const updatedLoad = await Load.findByIdAndUpdate(load._id, {
      state: newState,
    });

    await updatedLoad.addLog(`Change load state to: ${newState}`);

    if (newState === ARRIVED_TO_DELIVERY) {
      await this.finishDelivery(load);
    }

    return Load.findById(load._id);
  }

  async findLoadForTruck(truck) {
    const foundLoads = await Load.aggregate([
      {
        $match: {
          status: NEW,
          'dimensions.width': { $lte: truck.dimensions.width },
          'dimensions.length': { $lte: truck.dimensions.length },
          'dimensions.height': { $lte: truck.dimensions.height },
          payload: { $lte: truck.maxPayload },
        },
      },
      {
        $project: {
          createdAt: { $arrayElemAt: ['$logs.time', 0] },
        },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $limit: 1,
      },
    ]);

    return foundLoads.length > 0 ? this.findById(foundLoads[0]._id) : null;
  }

  getNextLoadState(load) {
    const statesTuple = [
      ROUTE_TO_PICK_UP,
      ARRIVED_TO_PICK_UP,
      ROUTE_TO_DELIVERY,
      ARRIVED_TO_DELIVERY,
    ];
    const currentStateIdx = statesTuple.indexOf(load.state);

    if (currentStateIdx === load.length - 1) {
      throw new HttpError(400, CANNOT_CHANGE_ARRIVED_LOAD_STATE);
    }

    return statesTuple[currentStateIdx + 1];
  }

  async getLoadsForRole(user, status) {
    switch (user.role) {
      case DRIVER:
        return [await driverService.getAssignedDriverLoad(user)];
      case SHIPPER:
        return this.findByCreatedUserId(user._id, status);
    }
  }

  async getActiveLoads(user) {
    switch (user.role) {
      case DRIVER:
        return [await driverService.getAssignedDriverLoad(user)];
      default:
        throw new Error('[ERROR]: Getting active load is only for driver role');
    }
  }

  convertLoadEntityToLoadResponseDto(loadEntity) {
    return {
      _id: loadEntity._id,
      assigned_to: loadEntity.assignedTo,
      created_by: loadEntity.createdBy,
      status: loadEntity.status,
      pickup_address: loadEntity.pickup_address,
      delivery_address: loadEntity.delivery_address,
      state: loadEntity.state,
      logs: loadEntity.logs.map((log) => ({
        message: log.message,
        time: moment(log.time).format('X'),
      })),
      payload: loadEntity.payload,
      dimensions: loadEntity.dimensions,
    };
  }

  convertEntityListToResponseDtoList(loadEntityList) {
    return loadEntityList.map((loadEntity) => {
      return this.convertLoadEntityToLoadResponseDto(loadEntity);
    });
  }
}

module.exports = new LoadService();
