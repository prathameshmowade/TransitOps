import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { validateTrip, hasErrors } from '../../utils/validators';
import './Trips.css';

const statusBadge = {
  'Draft': 'badge-neutral',
  'Dispatched': 'badge-warning',
  'Completed': 'badge-success',
  'Cancelled': 'badge-danger',
};

const Trips = () => {
  const {
    trips,
    vehicles,
    drivers,
    createTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,
  } = useData();

  // Create Form State
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Complete Trip Modal State
  const [completeTargetTrip, setCompleteTargetTrip] = useState(null);
  const [endOdometer, setEndOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [revenue, setRevenue] = useState('15000');
  const [completeError, setCompleteError] = useState('');

  // Dropdowns - Available only
  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => v.status === 'Available');
  }, [vehicles]);

  const availableDrivers = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return drivers.filter(d => d.status === 'Available' && d.licenseExpiry >= today);
  }, [drivers]);

  // Capacity validation calculations
  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  const capacityDiff = useMemo(() => {
    if (!selectedVehicle || !cargoWeight) return 0;
    return Number(cargoWeight) - selectedVehicle.maxLoadCapacity;
  }, [selectedVehicle, cargoWeight]);

  const capacityExceeded = capacityDiff > 0;

  const handleCancelForm = () => {
    setSource('');
    setDestination('');
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setCargoWeight('');
    setPlannedDistance('');
    setFormErrors({});
    setSubmitError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');

    const data = {
      source,
      destination,
      vehicleId: selectedVehicleId || null,
      driverId: selectedDriverId || null,
      cargoWeight: cargoWeight ? Number(cargoWeight) : '',
      plannedDistance: plannedDistance ? Number(plannedDistance) : '',
    };

    const errors = validateTrip(data, vehicles, drivers);
    if (hasErrors(errors)) {
      setFormErrors(errors);
      return;
    }

    if (capacityExceeded) {
      setSubmitError('Dispatcher blocked: Cargo weight exceeds capacity.');
      return;
    }

    try {
      createTrip({
        source: source.trim(),
        destination: destination.trim(),
        vehicleId: selectedVehicleId || null,
        driverId: selectedDriverId || null,
        cargoWeight: Number(cargoWeight),
        plannedDistance: Number(plannedDistance),
      });

      handleCancelForm();
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const handleDispatch = (tripId) => {
    try {
      dispatchTrip(tripId);
    } catch (err) {
      alert(err.message);
    }
  };

  const openCompleteModal = (trip) => {
    setCompleteTargetTrip(trip);
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    setEndOdometer(vehicle ? String(vehicle.odometer + trip.plannedDistance) : '');
    setFuelConsumed('');
    setRevenue('15000');
    setCompleteError('');
  };

  const closeCompleteModal = () => {
    setCompleteTargetTrip(null);
    setEndOdometer('');
    setFuelConsumed('');
    setCompleteError('');
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    setCompleteError('');

    if (!endOdometer || isNaN(endOdometer) || Number(endOdometer) <= 0) {
      setCompleteError('Please enter a valid ending odometer reading.');
      return;
    }

    const startOdometer = completeTargetTrip.startOdometer || 0;
    if (Number(endOdometer) <= startOdometer) {
      setCompleteError(`Ending odometer must be greater than start odometer (${startOdometer} km).`);
      return;
    }

    if (!fuelConsumed || isNaN(fuelConsumed) || Number(fuelConsumed) < 0) {
      setCompleteError('Please enter valid fuel consumed.');
      return;
    }

    try {
      completeTrip(completeTargetTrip.id, {
        endOdometer: Number(endOdometer),
        fuelConsumed: Number(fuelConsumed),
        revenue: Number(revenue) || 0,
      });
      closeCompleteModal();
    } catch (err) {
      setCompleteError(err.message);
    }
  };

  const getVehicleReg = (id) => vehicles.find(v => v.id === id)?.registrationNumber || 'Unassigned';
  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || 'Unassigned';
  const getVehicleType = (id) => vehicles.find(v => v.id === id)?.type || '';

  // Get display text for ETA / state as shown on Live Board
  const getTripMetaText = (trip) => {
    if (trip.status === 'Completed') return 'Completed';
    if (trip.status === 'Cancelled') return 'Vehicle went to shop';
    if (trip.status === 'Draft') {
      if (!trip.driverId) return 'Awaiting driver';
      if (!trip.vehicleId) return 'Awaiting vehicle';
      return 'Ready to dispatch';
    }
    if (trip.status === 'Dispatched') return `${trip.plannedDistance} km planned`;
    return '';
  };

  return (
    <div className="trips-page">
      {/* Left Column: Create Trip */}
      <div className="trip-form-panel">
        <h3 className="trip-form-title">Create Trip</h3>

        {/* Timeline representing from Mockup */}
        <div className="trip-timeline">
          <div className="timeline-step active">
            1
            <span className="timeline-label">Draft</span>
          </div>
          <div className="timeline-step">
            2
            <span className="timeline-label">Dispatched</span>
          </div>
          <div className="timeline-step">
            3
            <span className="timeline-label">Completed</span>
          </div>
        </div>

        {submitError && <div className="alert alert-error"><span>✗</span> {submitError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Source Depot/Location *</label>
            <input
              type="text"
              className={`form-input ${formErrors.source ? 'error' : ''}`}
              placeholder="e.g., Gandhinagar Depot"
              value={source}
              onChange={(e) => { setSource(e.target.value); setFormErrors(p => ({ ...p, source: undefined })); }}
            />
            {formErrors.source && <div className="field-error">{formErrors.source}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Destination Hub *</label>
            <input
              type="text"
              className={`form-input ${formErrors.destination ? 'error' : ''}`}
              placeholder="e.g., Ahmedabad Hub"
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setFormErrors(p => ({ ...p, destination: undefined })); }}
            />
            {formErrors.destination && <div className="field-error">{formErrors.destination}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle (Available Only) *</label>
            <select
              className={`form-input ${formErrors.vehicleId ? 'error' : ''}`}
              value={selectedVehicleId}
              onChange={(e) => { setSelectedVehicleId(e.target.value); setFormErrors(p => ({ ...p, vehicleId: undefined })); }}
            >
              <option value="">Select vehicle...</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} — {v.name} ({v.maxLoadCapacity} kg capacity)
                </option>
              ))}
            </select>
            {formErrors.vehicleId && <div className="field-error">{formErrors.vehicleId}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Driver (Available Only) *</label>
            <select
              className={`form-input ${formErrors.driverId ? 'error' : ''}`}
              value={selectedDriverId}
              onChange={(e) => { setSelectedDriverId(e.target.value); setFormErrors(p => ({ ...p, driverId: undefined })); }}
            >
              <option value="">Select driver...</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.licenseCategory})
                </option>
              ))}
            </select>
            {formErrors.driverId && <div className="field-error">{formErrors.driverId}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Cargo Weight (kg) *</label>
            <input
              type="number"
              className={`form-input ${formErrors.cargoWeight || capacityExceeded ? 'error' : ''}`}
              placeholder="e.g., 700"
              value={cargoWeight}
              onChange={(e) => { setCargoWeight(e.target.value); setFormErrors(p => ({ ...p, cargoWeight: undefined })); }}
              min="0"
            />
            {formErrors.cargoWeight && <div className="field-error">{formErrors.cargoWeight}</div>}
          </div>

          {capacityExceeded && selectedVehicle && (
            <div className="capacity-error-block">
              <div className="capacity-error-title">✗ Capacity Exceeded</div>
              <div className="capacity-error-details">
                Vehicle Capacity: {selectedVehicle.maxLoadCapacity} kg, Cargo Weight: {cargoWeight} kg.<br />
                Capacity exceeded by {capacityDiff} kg — dispatcher blocked.
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Planned Distance (km) *</label>
            <input
              type="number"
              className={`form-input ${formErrors.plannedDistance ? 'error' : ''}`}
              placeholder="e.g., 38"
              value={plannedDistance}
              onChange={(e) => { setPlannedDistance(e.target.value); setFormErrors(p => ({ ...p, plannedDistance: undefined })); }}
              min="0"
            />
            {formErrors.plannedDistance && <div className="field-error">{formErrors.plannedDistance}</div>}
          </div>

          <div className="trip-form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={capacityExceeded}
            >
              Dispatch
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancelForm}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Live Board */}
      <div className="live-board-section">
        <h2 className="live-board-title">Live Board</h2>

        <div className="live-board-grid">
          {[...trips]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((trip) => {
              const hasAssigned = trip.vehicleId || trip.driverId;
              const vehicleReg = getVehicleReg(trip.vehicleId);
              const vehicleType = getVehicleType(trip.vehicleId);
              const driverName = getDriverName(trip.driverId);
              const identityString = hasAssigned
                ? `${vehicleReg} (${vehicleType || 'Vehicle'}) / ${driverName.split(' ')[0].toUpperCase()}`
                : 'Unassigned';

              return (
                <div className="live-trip-card" key={trip.id}>
                  <div className="live-trip-header">
                    <div className="live-trip-identity">
                      <span className="live-trip-id">{trip.id.slice(0, 6).toUpperCase()}</span>
                      <span className="live-trip-divider">|</span>
                      <span className="live-trip-assets">{identityString}</span>
                    </div>
                  </div>

                  <div className="live-trip-route">
                    {trip.source} ➔ {trip.destination}
                  </div>

                  <div className="live-trip-footer">
                    <span className={`badge ${statusBadge[trip.status] || 'badge-neutral'}`}>
                      {trip.status}
                    </span>
                    <span className="live-trip-eta">{getTripMetaText(trip)}</span>
                  </div>

                  {/* Actions inside the live board */}
                  {(trip.status === 'Draft' || trip.status === 'Dispatched') && (
                    <div className="live-trip-card-actions">
                      {trip.status === 'Draft' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleDispatch(trip.id)}
                            disabled={!trip.vehicleId || !trip.driverId}
                          >
                            Dispatch
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => cancelTrip(trip.id)}>
                            Cancel
                          </button>
                        </>
                      )}
                      {trip.status === 'Dispatched' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => openCompleteModal(trip)}>
                            Complete
                          </button>
                          <button className="btn btn-outline btn-sm btn-danger" onClick={() => cancelTrip(trip.id)}>
                            Cancel Dispatch
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="live-board-footnote">
          On Complete: odometer ➔ fuel log ➔ expenses ➔ Vehicle & Driver available.
        </div>
      </div>

      {/* Complete Trip Modal */}
      {completeTargetTrip && (
        <div className="modal-overlay" onClick={closeCompleteModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Complete Trip</h3>
              <button className="modal-close" onClick={closeCompleteModal}>✕</button>
            </div>

            {completeError && <div className="alert alert-error"><span>✗</span> {completeError}</div>}

            <form onSubmit={handleCompleteSubmit}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Trip Route: <strong>{completeTargetTrip.source} ➔ {completeTargetTrip.destination}</strong><br />
                Start Odometer: <strong>{completeTargetTrip.startOdometer} km</strong>
              </p>

              <div className="form-group">
                <label className="form-label">Ending Odometer (km) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder={`Greater than ${completeTargetTrip.startOdometer || 0}`}
                  value={endOdometer}
                  onChange={(e) => setEndOdometer(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actual Fuel Consumed (Liters) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g., 35"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Revenue Generated (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g., 15000"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeCompleteModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
