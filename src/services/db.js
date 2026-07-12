// ─── LocalStorage-backed Data Service ───
// All entities are stored as JSON arrays in localStorage.
// Provides CRUD + query helpers. Easy to swap for a REST API later.

const DB_PREFIX = 'transitops_';
const SEED_KEY = 'transitops_seeded';

// ── Seed Data ──
const seedVehicles = [
  { id: 'v1', registrationNumber: 'VAN-05', name: 'Transit Van 05', type: 'Van', maxLoadCapacity: 500, odometer: 12450, acquisitionCost: 850000, status: 'Available', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'v2', registrationNumber: 'TRV-12', name: 'Travel Bus 12', type: 'Bus', maxLoadCapacity: 2000, odometer: 45000, acquisitionCost: 3200000, status: 'Available', createdAt: '2025-08-20T10:00:00Z' },
  { id: 'v3', registrationNumber: 'MTAT-04', name: 'Matat Truck 04', type: 'Truck', maxLoadCapacity: 8000, odometer: 78200, acquisitionCost: 2100000, status: 'On Trip', createdAt: '2025-03-10T10:00:00Z' },
  { id: 'v4', registrationNumber: 'TRK-07', name: 'Cargo Truck 07', type: 'Truck', maxLoadCapacity: 10000, odometer: 92100, acquisitionCost: 2800000, status: 'In Shop', createdAt: '2024-11-05T10:00:00Z' },
  { id: 'v5', registrationNumber: 'BUS-01', name: 'City Bus 01', type: 'Bus', maxLoadCapacity: 1500, odometer: 120000, acquisitionCost: 4500000, status: 'Retired', createdAt: '2023-06-01T10:00:00Z' },
];

const seedDrivers = [
  { id: 'd1', name: 'Alex Sharma', licenseNumber: 'DL-2026-001', licenseCategory: 'HMV', licenseExpiry: '2027-06-15', contactNumber: '9876543210', safetyScore: 92, status: 'Available', createdAt: '2026-01-10T10:00:00Z' },
  { id: 'd2', name: 'Ivan Rodrigues', licenseNumber: 'DL-2025-042', licenseCategory: 'HMV', licenseExpiry: '2026-12-31', contactNumber: '9876543211', safetyScore: 88, status: 'Available', createdAt: '2025-09-01T10:00:00Z' },
  { id: 'd3', name: 'Priya Patel', licenseNumber: 'DL-2024-118', licenseCategory: 'LMV', licenseExpiry: '2027-03-20', contactNumber: '9876543212', safetyScore: 95, status: 'On Trip', createdAt: '2025-05-15T10:00:00Z' },
  { id: 'd4', name: 'Sam Wilson', licenseNumber: 'DL-2023-077', licenseCategory: 'HMV', licenseExpiry: '2025-01-01', contactNumber: '9876543213', safetyScore: 70, status: 'Suspended', createdAt: '2024-08-20T10:00:00Z' },
  { id: 'd5', name: 'Maya Desai', licenseNumber: 'DL-2026-203', licenseCategory: 'LMV', licenseExpiry: '2028-09-10', contactNumber: '9876543214', safetyScore: 97, status: 'Off Duty', createdAt: '2026-02-01T10:00:00Z' },
];

const seedTrips = [
  { id: 't1', source: 'Mumbai', destination: 'Pune', vehicleId: 'v3', driverId: 'd3', cargoWeight: 6500, plannedDistance: 150, actualDistance: null, fuelConsumed: null, status: 'Dispatched', startOdometer: 78200, endOdometer: null, createdAt: '2026-07-10T08:00:00Z' },
  { id: 't2', source: 'Delhi', destination: 'Jaipur', vehicleId: 'v1', driverId: 'd1', cargoWeight: 350, plannedDistance: 280, actualDistance: 285, fuelConsumed: 32, status: 'Completed', startOdometer: 12100, endOdometer: 12385, revenue: 15000, createdAt: '2026-07-08T06:00:00Z' },
  { id: 't3', source: 'Bangalore', destination: 'Chennai', vehicleId: null, driverId: null, cargoWeight: 1200, plannedDistance: 350, actualDistance: null, fuelConsumed: null, status: 'Draft', startOdometer: null, endOdometer: null, createdAt: '2026-07-11T14:00:00Z' },
  { id: 't4', source: 'Ahmedabad', destination: 'Surat', vehicleId: 'v2', driverId: 'd2', cargoWeight: 1800, plannedDistance: 265, actualDistance: 270, fuelConsumed: 45, status: 'Completed', startOdometer: 44730, endOdometer: 45000, revenue: 22000, createdAt: '2026-07-05T09:00:00Z' },
];

const seedMaintenance = [
  { id: 'm1', vehicleId: 'v4', type: 'Engine Repair', description: 'Engine overheating issue — full coolant system replacement', cost: 45000, startDate: '2026-07-09', endDate: null, status: 'In Progress', createdAt: '2026-07-09T10:00:00Z' },
  { id: 'm2', vehicleId: 'v1', type: 'Oil Change', description: 'Regular 10,000 km service — oil and filter change', cost: 3500, startDate: '2026-07-01', endDate: '2026-07-01', status: 'Completed', createdAt: '2026-07-01T10:00:00Z' },
];

const seedFuelLogs = [
  { id: 'f1', vehicleId: 'v1', tripId: 't2', liters: 32, costPerLiter: 105, totalCost: 3360, date: '2026-07-08', createdAt: '2026-07-08T18:00:00Z' },
  { id: 'f2', vehicleId: 'v2', tripId: 't4', liters: 45, costPerLiter: 105, totalCost: 4725, date: '2026-07-05', createdAt: '2026-07-05T17:00:00Z' },
  { id: 'f3', vehicleId: 'v3', tripId: null, liters: 80, costPerLiter: 102, totalCost: 8160, date: '2026-07-10', createdAt: '2026-07-10T07:00:00Z' },
];

const seedExpenses = [
  { id: 'e1', vehicleId: 'v1', tripId: 't2', type: 'Toll', description: 'Mumbai-Pune Expressway toll', amount: 450, date: '2026-07-08', createdAt: '2026-07-08T10:00:00Z' },
  { id: 'e2', vehicleId: 'v2', tripId: 't4', type: 'Toll', description: 'NH-48 toll charges', amount: 320, date: '2026-07-05', createdAt: '2026-07-05T10:00:00Z' },
  { id: 'e3', vehicleId: 'v3', tripId: null, type: 'Parking', description: 'Overnight parking at depot', amount: 200, date: '2026-07-10', createdAt: '2026-07-10T20:00:00Z' },
];

const seedUsers = [
  { id: 'u1', email: 'fleet@transitops.in', password: 'admin123', role: 'Fleet Manager', name: 'Ravi Kumar' },
  { id: 'u2', email: 'dispatch@transitops.in', password: 'admin123', role: 'Dispatcher', name: 'Sneha Gupta' },
  { id: 'u3', email: 'safety@transitops.in', password: 'admin123', role: 'Safety Officer', name: 'Arun Nair' },
  { id: 'u4', email: 'finance@transitops.in', password: 'admin123', role: 'Financial Analyst', name: 'Kavita Joshi' },
];

// ── Helpers ──
function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getStore(entity) {
  try {
    const data = localStorage.getItem(DB_PREFIX + entity);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStore(entity, data) {
  localStorage.setItem(DB_PREFIX + entity, JSON.stringify(data));
}

// ── Seed on first load ──
export function seedDatabase() {
  if (localStorage.getItem(SEED_KEY)) return;
  setStore('vehicles', seedVehicles);
  setStore('drivers', seedDrivers);
  setStore('trips', seedTrips);
  setStore('maintenance', seedMaintenance);
  setStore('fuelLogs', seedFuelLogs);
  setStore('expenses', seedExpenses);
  setStore('users', seedUsers);
  localStorage.setItem(SEED_KEY, 'true');
}

// ── Generic CRUD ──
export function getAll(entity) {
  return getStore(entity);
}

export function getById(entity, id) {
  return getStore(entity).find((item) => item.id === id) || null;
}

export function create(entity, record) {
  const items = getStore(entity);
  const newItem = { ...record, id: record.id || generateId(entity[0]), createdAt: new Date().toISOString() };
  items.push(newItem);
  setStore(entity, items);
  return newItem;
}

export function update(entity, id, updates) {
  const items = getStore(entity);
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  setStore(entity, items);
  return items[idx];
}

export function remove(entity, id) {
  const items = getStore(entity).filter((item) => item.id !== id);
  setStore(entity, items);
}

// ── Auth helpers ──
export function authenticateUser(email, password) {
  const users = getStore('users');
  return users.find((u) => u.email === email && u.password === password) || null;
}

// ── Query helpers ──
export function getVehiclesByStatus(status) {
  return getStore('vehicles').filter((v) => v.status === status);
}

export function getAvailableDrivers() {
  const today = new Date().toISOString().split('T')[0];
  return getStore('drivers').filter(
    (d) => d.status === 'Available' && d.licenseExpiry >= today
  );
}

export function getAvailableVehicles() {
  return getStore('vehicles').filter((v) => v.status === 'Available');
}

export function getTripsByStatus(status) {
  return getStore('trips').filter((t) => t.status === status);
}

export function getFuelLogsByVehicle(vehicleId) {
  return getStore('fuelLogs').filter((f) => f.vehicleId === vehicleId);
}

export function getExpensesByVehicle(vehicleId) {
  return getStore('expenses').filter((e) => e.vehicleId === vehicleId);
}

export function getMaintenanceByVehicle(vehicleId) {
  return getStore('maintenance').filter((m) => m.vehicleId === vehicleId);
}

export function getTotalFuelCostByVehicle(vehicleId) {
  return getFuelLogsByVehicle(vehicleId).reduce((sum, f) => sum + f.totalCost, 0);
}

export function getTotalMaintenanceCostByVehicle(vehicleId) {
  return getMaintenanceByVehicle(vehicleId).reduce((sum, m) => sum + m.cost, 0);
}

export function resetDatabase() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(DB_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem(SEED_KEY);
  seedDatabase();
}
