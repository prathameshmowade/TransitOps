// ── Input Validators ──
// Each returns an errors object: { fieldName: 'error message' }
// Empty object = valid.

export function validateEmail(email) {
  const errors = {};
  if (!email || !email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  return errors;
}

export function validatePassword(password) {
  const errors = {};
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  return errors;
}

export function validateVehicle(data, existingVehicles = [], editingId = null) {
  const errors = {};

  if (!data.registrationNumber || !data.registrationNumber.trim()) {
    errors.registrationNumber = 'Registration number is required.';
  } else {
    const duplicate = existingVehicles.find(
      (v) => v.registrationNumber === data.registrationNumber.trim() && v.id !== editingId
    );
    if (duplicate) errors.registrationNumber = 'This registration number is already in use.';
  }

  if (!data.name || !data.name.trim()) {
    errors.name = 'Vehicle name/model is required.';
  }

  if (!data.type) {
    errors.type = 'Vehicle type is required.';
  }

  if (!data.maxLoadCapacity || isNaN(data.maxLoadCapacity) || Number(data.maxLoadCapacity) <= 0) {
    errors.maxLoadCapacity = 'Max load capacity must be a positive number.';
  }

  if (data.odometer !== undefined && data.odometer !== '' && (isNaN(data.odometer) || Number(data.odometer) < 0)) {
    errors.odometer = 'Odometer must be a non-negative number.';
  }

  if (!data.acquisitionCost || isNaN(data.acquisitionCost) || Number(data.acquisitionCost) <= 0) {
    errors.acquisitionCost = 'Acquisition cost must be a positive number.';
  }

  return errors;
}

export function validateDriver(data) {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Driver name is required.';
  }

  if (!data.licenseNumber || !data.licenseNumber.trim()) {
    errors.licenseNumber = 'License number is required.';
  } else if (!/^[A-Z]{2}-\d{4}-\d{3,}$/.test(data.licenseNumber.trim())) {
    errors.licenseNumber = 'License format: XX-YYYY-NNN (e.g., DL-2026-001).';
  }

  if (!data.licenseCategory) {
    errors.licenseCategory = 'License category is required.';
  }

  if (!data.licenseExpiry) {
    errors.licenseExpiry = 'License expiry date is required.';
  }

  if (!data.contactNumber || !data.contactNumber.trim()) {
    errors.contactNumber = 'Contact number is required.';
  } else if (!/^\d{10}$/.test(data.contactNumber.trim())) {
    errors.contactNumber = 'Enter a valid 10-digit phone number.';
  }

  return errors;
}

export function validateTrip(data, vehicles = [], drivers = []) {
  const errors = {};

  if (!data.source || !data.source.trim()) {
    errors.source = 'Source is required.';
  }

  if (!data.destination || !data.destination.trim()) {
    errors.destination = 'Destination is required.';
  }

  if (data.source && data.destination && data.source.trim().toLowerCase() === data.destination.trim().toLowerCase()) {
    errors.destination = 'Destination must differ from source.';
  }

  if (!data.cargoWeight || isNaN(data.cargoWeight) || Number(data.cargoWeight) <= 0) {
    errors.cargoWeight = 'Cargo weight must be a positive number.';
  }

  if (!data.plannedDistance || isNaN(data.plannedDistance) || Number(data.plannedDistance) <= 0) {
    errors.plannedDistance = 'Planned distance must be a positive number.';
  }

  if (data.vehicleId) {
    const vehicle = vehicles.find((v) => v.id === data.vehicleId);
    if (vehicle && data.cargoWeight && Number(data.cargoWeight) > vehicle.maxLoadCapacity) {
      errors.cargoWeight = `Cargo (${data.cargoWeight} kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity} kg).`;
    }
  }

  if (data.driverId) {
    const driver = drivers.find((d) => d.id === data.driverId);
    if (driver) {
      const today = new Date().toISOString().split('T')[0];
      if (driver.licenseExpiry < today) {
        errors.driverId = 'This driver\'s license has expired.';
      }
    }
  }

  return errors;
}

export function validateMaintenance(data) {
  const errors = {};

  if (!data.vehicleId) {
    errors.vehicleId = 'Select a vehicle.';
  }

  if (!data.type || !data.type.trim()) {
    errors.type = 'Maintenance type is required.';
  }

  if (!data.cost || isNaN(data.cost) || Number(data.cost) <= 0) {
    errors.cost = 'Cost must be a positive number.';
  }

  if (!data.startDate) {
    errors.startDate = 'Start date is required.';
  }

  return errors;
}

export function validateFuelLog(data) {
  const errors = {};

  if (!data.vehicleId) {
    errors.vehicleId = 'Select a vehicle.';
  }

  if (!data.liters || isNaN(data.liters) || Number(data.liters) <= 0) {
    errors.liters = 'Liters must be a positive number.';
  }

  if (!data.costPerLiter || isNaN(data.costPerLiter) || Number(data.costPerLiter) <= 0) {
    errors.costPerLiter = 'Cost per liter must be a positive number.';
  }

  if (!data.date) {
    errors.date = 'Date is required.';
  }

  return errors;
}

export function validateExpense(data) {
  const errors = {};

  if (!data.type || !data.type.trim()) {
    errors.type = 'Expense type is required.';
  }

  if (!data.amount || isNaN(data.amount) || Number(data.amount) <= 0) {
    errors.amount = 'Amount must be a positive number.';
  }

  if (!data.date) {
    errors.date = 'Date is required.';
  }

  return errors;
}

// Helper: check if errors object has any errors
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
