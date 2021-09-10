
const handleTruckCollectionUpdated = async function(updatedTruck, next) {
  const loadService = require('../service/LoadService');
  const truckService = require('../service/TruckService');

  if (!truckService.isTruckAvailableForWork(updatedTruck)) {
    return next();
  }

  const foundLoad = await loadService.findLoadForTruck(updatedTruck);

  if (foundLoad) {
    await loadService.connectTruckAndLoad(updatedTruck, foundLoad);
  }

  next();
};

module.exports = {
  handleTruckCollectionUpdated,
};
