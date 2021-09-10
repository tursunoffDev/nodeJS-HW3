const Truck = require('../model/truck.model');
const {
  CANNOT_CHANGE_DATA_OL,
  CANNOT_CHANGE_DATA_ASSIGNED_TRUCK,
  TRUCK_NOT_FOUND_BY_ID,
  USER_LACKS_AUTHORITY,
} = require('../constants/errors');
const { IS } = require('../constants/truckStatuses');
const HttpError = require('../utils/HttpError');

class TruckService {
  findAll() {
    return Truck.find();
  }

  findByCreatedUserId(userId) {
    return Truck.find({ createdBy: userId });
  }

  async findById(id) {
    const foundTruck = await Truck.findById(id);

    if (!foundTruck) {
      throw new HttpError(400, TRUCK_NOT_FOUND_BY_ID);
    }

    return foundTruck;
  }

  save(truckDto) {
    truckDto.status = IS;
    const newTruck = Truck.create(truckDto);
    return newTruck;
  }

  async remove(truck) {
    await this.checkTruckCanBeModified(truck);
    return Truck.findByIdAndDelete(truck);
  }

  async updateById(id, editedTruckData) {
    const truck = await Truck.findById(id).populate('createdBy');
    await this.checkTruckCanBeModified(truck);

    await truck.update(editedTruckData).exec();

    const updTruck = await Truck.findById(truck);
    await updTruck.save();

    return updTruck;
  }

  async findTruckForLoad(load) {
    const foundTrucks = await Truck.aggregate([
      {
        $match: {
          status: IS,
          assignedTo: { $exists: true },
          'dimensions.width': { $gte: load.dimensions.width },
          'dimensions.length': { $gte: load.dimensions.length },
          'dimensions.height': { $gte: load.dimensions.height },
          maxPayload: { $gte: load.payload },
        },
      },
      {
        $project: {
          capacityIndex: {
            $multiply: [
              '$dimensions.length',
              '$dimensions.height',
              '$dimensions.width',
              '$maxPayload',
            ],
          },
        },
      },
      {
        $sort: { capacityIndex: 1 },
      },
      {
        $limit: 1,
      },
    ]);

    return foundTrucks.length > 0 ? this.findById(foundTrucks[0]._id) : null;
  }

  isTruckAvailableForWork(truck) {
    return truck.status === IS && !!truck.assignedTo;
  }

  checkDriverReadWriteRights(driver, truck) {
    if (!driver.equals(truck.createdBy)) {
      throw new HttpError(400, USER_LACKS_AUTHORITY);
    }
  }

  async checkTruckCanBeModified(truck) {
    const populatedTruck = await truck.populate('createdBy').execPopulate();
    const truckOwner = populatedTruck.createdBy;

    if (truckOwner.assignedLoad) {
      throw new HttpError(400, CANNOT_CHANGE_DATA_OL);
    }
    if (populatedTruck.assignedTo) {
      throw new HttpError(400, CANNOT_CHANGE_DATA_ASSIGNED_TRUCK);
    }
  }

  async unassignDriverFromTruck(truckId) {
    return Truck.findByIdAndUpdate(truckId, { $unset: { assignedTo: null } });
  }

  convertTruckEntityToTruckResponseDto(truckEntity) {
    return {
      _id: truckEntity._id,
      assigned_to: truckEntity.assignedTo || null,
      created_by: truckEntity.createdBy,
      status: truckEntity.status,
      type: truckEntity.type,
      maxPayload: truckEntity.maxPayload,
      dimensions: truckEntity.dimensions,
      created_date: truckEntity.createdDate,
    };
  }

  convertEntityListToResponseDtoList(truckEntityList) {
    return truckEntityList.map((truckEntity) => {
      return this.convertTruckEntityToTruckResponseDto(truckEntity);
    });
  }
}

module.exports = new TruckService();
