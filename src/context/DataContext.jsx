import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import * as db from '../services/db';

const DataContext = createContext(null);

// ── Actions ──
const ACTIONS = {
  INIT: 'INIT',
  SET_VEHICLES: 'SET_VEHICLES',
  SET_DRIVERS: 'SET_DRIVERS',
  SET_TRIPS: 'SET_TRIPS',
  SET_MAINTENANCE: 'SET_MAINTENANCE',
  SET_FUEL_LOGS: 'SET_FUEL_LOGS',
  SET_EXPENSES: 'SET_EXPENSES',
  RELOAD_ALL: 'RELOAD_ALL',
};

function loadAll() {
  return {
    vehicles: db.getAll('vehicles'),
    drivers: db.getAll('drivers'),
    trips: db.getAll('trips'),
    maintenance: db.getAll('maintenance'),
    fuelLogs: db.getAll('fuelLogs'),
    expenses: db.getAll('expenses'),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.INIT:
    case ACTIONS.RELOAD_ALL:
      return { ...state, ...loadAll() };
    case ACTIONS.SET_VEHICLES:
      return { ...state, vehicles: db.getAll('vehicles') };
    case ACTIONS.SET_DRIVERS:
      return { ...state, drivers: db.getAll('drivers') };
    case ACTIONS.SET_TRIPS:
      return { ...state, trips: db.getAll('trips') };
    case ACTIONS.SET_MAINTENANCE:
      return { ...state, maintenance: db.getAll('maintenance') };
    case ACTIONS.SET_FUEL_LOGS:
      return { ...state, fuelLogs: db.getAll('fuelLogs') };
    case ACTIONS.SET_EXPENSES:
      return { ...state, expenses: db.getAll('expenses') };
    default:
      return state;
  }
}

const initialState = { vehicles: [], drivers: [], trips: [], maintenance: [], fuelLogs: [], expenses: [] };

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [notifications, setNotifications] = React.useState([]);

  const addNotification = React.useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [
      { id, message, type, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ...prev
    ]);
  }, []);

  const clearNotification = React.useCallback((id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  }, []);

  // Utility helper for names inside scanner
  const getVehicleReg = React.useCallback((id) => {
    const v = state.vehicles.find(x => x.id === id);
    return v ? v.registrationNumber : 'Unknown';
  }, [state.vehicles]);

  // Run compliance scans when database is loaded
  React.useEffect(() => {
    db.seedDatabase();
    dispatch({ type: ACTIONS.INIT });

    // Read directly from DB to do startup compliance alert scan
    const vehiclesData = db.getAll('vehicles');
    const driversData = db.getAll('drivers');
    const maintData = db.getAll('maintenance');
    const today = new Date().toISOString().split('T')[0];

    driversData.forEach(d => {
      if (d.licenseExpiry < today) {
        addNotification(`Compliance Alert: Driver ${d.name}'s license is EXPIRED (${d.licenseExpiry}).`, 'warning');
      } else if (d.safetyScore < 60) {
        addNotification(`Safety Alert: Driver ${d.name}'s safety rating is low (${d.safetyScore}/100).`, 'warning');
      }
    });

    maintData.forEach(m => {
      if (m.status === 'In Progress' || m.status === 'In Shop') {
        const reg = vehiclesData.find(v => v.id === m.vehicleId)?.registrationNumber || 'Unknown';
        addNotification(`Operations: Vehicle ${reg} is undergoing ${m.type}.`, 'info');
      }
    });
  }, [addNotification]);

  const reload = useCallback(() => dispatch({ type: ACTIONS.RELOAD_ALL }), []);

  // ── Vehicle CRUD ──
  const addVehicle = useCallback((data) => {
    // Check unique registration
    const existing = state.vehicles.find(v => v.registrationNumber === data.registrationNumber);
    if (existing) throw new Error(`Vehicle with registration ${data.registrationNumber} already exists.`);
    db.create('vehicles', data);
    dispatch({ type: ACTIONS.SET_VEHICLES });
    addNotification(`Vehicle ${data.registrationNumber} added to registry.`, 'success');
  }, [state.vehicles, addNotification]);

  const updateVehicle = useCallback((id, data) => {
    db.update('vehicles', id, data);
    dispatch({ type: ACTIONS.SET_VEHICLES });
    addNotification(`Vehicle ${data.registrationNumber} details updated.`, 'info');
  }, [addNotification]);

  const deleteVehicle = useCallback((id) => {
    const v = db.getById('vehicles', id);
    db.remove('vehicles', id);
    dispatch({ type: ACTIONS.SET_VEHICLES });
    if (v) addNotification(`Vehicle ${v.registrationNumber} deleted from registry.`, 'info');
  }, [addNotification]);

  // ── Driver CRUD ──
  const addDriver = useCallback((data) => {
    db.create('drivers', data);
    dispatch({ type: ACTIONS.SET_DRIVERS });
    addNotification(`Driver ${data.name} registered.`, 'success');
  }, [addNotification]);

  const updateDriver = useCallback((id, data) => {
    db.update('drivers', id, data);
    dispatch({ type: ACTIONS.SET_DRIVERS });
    addNotification(`Driver ${data.name} details updated.`, 'info');
  }, [addNotification]);

  const deleteDriver = useCallback((id) => {
    const d = db.getById('drivers', id);
    db.remove('drivers', id);
    dispatch({ type: ACTIONS.SET_DRIVERS });
    if (d) addNotification(`Driver ${d.name} deleted.`, 'info');
  }, [addNotification]);

  // ── Trip Management (with business rules) ──
  const createTrip = useCallback((data) => {
    const trip = { ...data, status: 'Draft' };
    db.create('trips', trip);
    dispatch({ type: ACTIONS.SET_TRIPS });
    addNotification(`New trip draft created from ${data.source} to ${data.destination}.`, 'info');
  }, [addNotification]);

  const dispatchTrip = useCallback((tripId) => {
    const trip = db.getById('trips', tripId);
    if (!trip) throw new Error('Trip not found.');
    if (trip.status !== 'Draft') throw new Error('Only Draft trips can be dispatched.');
    if (!trip.vehicleId || !trip.driverId) throw new Error('Assign a vehicle and driver before dispatching.');

    const vehicle = db.getById('vehicles', trip.vehicleId);
    const driver = db.getById('drivers', trip.driverId);

    if (!vehicle || vehicle.status !== 'Available') throw new Error('Selected vehicle is not available.');
    if (!driver || driver.status !== 'Available') throw new Error('Selected driver is not available.');

    const today = new Date().toISOString().split('T')[0];
    if (driver.licenseExpiry < today) throw new Error('Driver license has expired.');
    if (trip.cargoWeight > vehicle.maxLoadCapacity) throw new Error(`Cargo weight (${trip.cargoWeight} kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity} kg).`);

    // Status transitions
    db.update('trips', tripId, { status: 'Dispatched', startOdometer: vehicle.odometer });
    db.update('vehicles', trip.vehicleId, { status: 'On Trip' });
    db.update('drivers', trip.driverId, { status: 'On Trip' });

    dispatch({ type: ACTIONS.RELOAD_ALL });
    addNotification(`Trip dispatched: ${vehicle.registrationNumber} (Driver: ${driver.name}) heading to ${trip.destination}.`, 'success');
  }, [addNotification]);

  const completeTrip = useCallback((tripId, { endOdometer, fuelConsumed, revenue }) => {
    const trip = db.getById('trips', tripId);
    if (!trip) throw new Error('Trip not found.');
    if (trip.status !== 'Dispatched') throw new Error('Only Dispatched trips can be completed.');

    const actualDistance = endOdometer - (trip.startOdometer || 0);

    db.update('trips', tripId, { status: 'Completed', endOdometer, actualDistance, fuelConsumed, revenue: revenue || 0 });
    db.update('vehicles', trip.vehicleId, { status: 'Available', odometer: endOdometer });
    db.update('drivers', trip.driverId, { status: 'Available' });

    // Auto-create fuel log
    if (fuelConsumed > 0) {
      db.create('fuelLogs', {
        vehicleId: trip.vehicleId,
        tripId: tripId,
        liters: fuelConsumed,
        costPerLiter: 105,
        totalCost: fuelConsumed * 105,
        date: new Date().toISOString().split('T')[0],
      });
    }

    dispatch({ type: ACTIONS.RELOAD_ALL });
    addNotification(`Trip completed successfully: ${actualDistance} km covered. Revenue: ₹${Number(revenue).toLocaleString('en-IN')}.`, 'success');
  }, [addNotification]);

  const cancelTrip = useCallback((tripId) => {
    const trip = db.getById('trips', tripId);
    if (!trip) throw new Error('Trip not found.');
    if (trip.status !== 'Dispatched' && trip.status !== 'Draft') throw new Error('Only Draft or Dispatched trips can be cancelled.');

    if (trip.status === 'Dispatched') {
      if (trip.vehicleId) db.update('vehicles', trip.vehicleId, { status: 'Available' });
      if (trip.driverId) db.update('drivers', trip.driverId, { status: 'Available' });
    }

    db.update('trips', tripId, { status: 'Cancelled' });
    dispatch({ type: ACTIONS.RELOAD_ALL });
    addNotification(`Trip from ${trip.source} to ${trip.destination} has been cancelled.`, 'warning');
  }, [addNotification]);

  // ── Maintenance ──
  const createMaintenance = useCallback((data) => {
    db.create('maintenance', { ...data, status: 'In Progress' });
    db.update('vehicles', data.vehicleId, { status: 'In Shop' });
    dispatch({ type: ACTIONS.RELOAD_ALL });
    const reg = db.getById('vehicles', data.vehicleId)?.registrationNumber || 'Vehicle';
    addNotification(`Maintenance scheduled: ${reg} is now IN SHOP for ${data.type}.`, 'info');
  }, [addNotification]);

  const completeMaintenance = useCallback((maintenanceId) => {
    const record = db.getById('maintenance', maintenanceId);
    if (!record) throw new Error('Maintenance record not found.');
    db.update('maintenance', maintenanceId, { status: 'Completed', endDate: new Date().toISOString().split('T')[0] });

    const vehicle = db.getById('vehicles', record.vehicleId);
    if (vehicle && vehicle.status !== 'Retired') {
      db.update('vehicles', record.vehicleId, { status: 'Available' });
    }
    dispatch({ type: ACTIONS.RELOAD_ALL });
    addNotification(`Service resolved for ${vehicle?.registrationNumber}. Vehicle is back online.`, 'success');
  }, [addNotification]);

  // ── Fuel & Expenses ──
  const addFuelLog = useCallback((data) => {
    const total = data.liters * data.costPerLiter;
    db.create('fuelLogs', { ...data, totalCost: total });
    dispatch({ type: ACTIONS.SET_FUEL_LOGS });
    const reg = db.getById('vehicles', data.vehicleId)?.registrationNumber || 'Vehicle';
    addNotification(`Logged ${data.liters}L fuel for ${reg}. Total cost: ₹${total.toLocaleString('en-IN')}`, 'info');
  }, [addNotification]);

  const addExpense = useCallback((data) => {
    db.create('expenses', data);
    dispatch({ type: ACTIONS.SET_EXPENSES });
    addNotification(`Expense logged: ${data.type} amount ₹${data.amount.toLocaleString('en-IN')}`, 'info');
  }, [addNotification]);

  const value = {
    ...state,
    reload,
    notifications,
    clearNotification,
    addNotification,
    addVehicle, updateVehicle, deleteVehicle,
    addDriver, updateDriver, deleteDriver,
    createTrip, dispatchTrip, completeTrip, cancelTrip,
    createMaintenance, completeMaintenance,
    addFuelLog, addExpense,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
