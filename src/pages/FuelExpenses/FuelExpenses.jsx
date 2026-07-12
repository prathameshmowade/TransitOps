import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { validateFuelLog, validateExpense, hasErrors } from '../../utils/validators';
import './FuelExpenses.css';

const FuelExpenses = () => {
  const {
    fuelLogs,
    expenses,
    vehicles,
    trips,
    maintenance,
    addFuelLog,
    addExpense,
  } = useData();

  // Modals state
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Fuel Form state
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCostPerLiter, setFuelCostPerLiter] = useState('105');
  const [fuelErrors, setFuelErrors] = useState({});
  const [fuelSubmitError, setFuelSubmitError] = useState('');

  // Expense Form state
  const [expTripId, setExpTripId] = useState('');
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expType, setExpType] = useState('Toll');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDesc, setExpDesc] = useState('');
  const [expErrors, setExpErrors] = useState({});
  const [expSubmitError, setExpSubmitError] = useState('');

  // Dynamic calculations
  const totals = useMemo(() => {
    const totalFuel = fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
    const totalMaint = maintenance.reduce((sum, log) => sum + log.cost, 0);
    return {
      fuel: totalFuel,
      maintenance: totalMaint,
      operational: totalFuel + totalMaint,
    };
  }, [fuelLogs, maintenance]);

  // Grouped expenses for the second table
  const groupedExpenses = useMemo(() => {
    // We represent expenses grouped by trip.
    // If a trip has no custom expenses or linked maintenance, we still list active/completed trips to show costs.
    return trips.map(trip => {
      const tripExpenses = expenses.filter(e => e.tripId === trip.id);
      const toll = tripExpenses.filter(e => e.type === 'Toll').reduce((sum, e) => sum + e.amount, 0);
      const other = tripExpenses.filter(e => e.type !== 'Toll').reduce((sum, e) => sum + e.amount, 0);
      
      // Linked maintenance cost for the vehicle of this trip
      const vehicleMaint = trip.vehicleId
        ? maintenance.filter(m => m.vehicleId === trip.vehicleId).reduce((sum, m) => sum + m.cost, 0)
        : 0;

      return {
        tripId: trip.id,
        vehicleId: trip.vehicleId,
        toll,
        other,
        maintenance: vehicleMaint,
        total: toll + other + vehicleMaint,
      };
    }).filter(row => row.total > 0 || row.tripId); // Only show rows with values or valid trips
  }, [trips, expenses, maintenance]);

  // Dropdown list: show all non-retired vehicles
  const activeVehicles = useMemo(() => {
    return vehicles.filter(v => v.status !== 'Retired');
  }, [vehicles]);

  // Handle Trip Selection in Expense Form to auto-populate Vehicle
  const handleTripChangeInExpense = (tripId) => {
    setExpTripId(tripId);
    if (tripId) {
      const trip = trips.find(t => t.id === tripId);
      if (trip && trip.vehicleId) {
        setExpVehicleId(trip.vehicleId);
      } else {
        setExpVehicleId('');
      }
    } else {
      setExpVehicleId('');
    }
  };

  const handleFuelSubmit = (e) => {
    e.preventDefault();
    setFuelSubmitError('');

    const data = {
      vehicleId: fuelVehicleId,
      liters: fuelLiters ? Number(fuelLiters) : '',
      costPerLiter: fuelCostPerLiter ? Number(fuelCostPerLiter) : '',
      date: fuelDate,
    };

    const errors = validateFuelLog(data);
    if (hasErrors(errors)) {
      setFuelErrors(errors);
      return;
    }

    try {
      addFuelLog({
        vehicleId: fuelVehicleId,
        liters: Number(fuelLiters),
        costPerLiter: Number(fuelCostPerLiter),
        date: fuelDate,
      });

      // Clear & Close
      setFuelVehicleId('');
      setFuelLiters('');
      setFuelCostPerLiter('105');
      setFuelErrors({});
      setShowFuelModal(false);
    } catch (err) {
      setFuelSubmitError(err.message);
    }
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    setExpSubmitError('');

    const data = {
      type: expType,
      amount: expAmount ? Number(expAmount) : '',
      date: expDate,
    };

    const errors = validateExpense(data);
    if (hasErrors(errors)) {
      setExpErrors(errors);
      return;
    }

    if (!expVehicleId) {
      setExpSubmitError('Please select a vehicle or a trip with an assigned vehicle.');
      return;
    }

    try {
      addExpense({
        tripId: expTripId || null,
        vehicleId: expVehicleId,
        type: expType,
        amount: Number(expAmount),
        date: expDate,
        description: expDesc.trim() || `${expType} expense`,
      });

      // Clear & Close
      setExpTripId('');
      setExpVehicleId('');
      setExpType('Toll');
      setExpAmount('');
      setExpDesc('');
      setExpErrors({});
      setShowExpenseModal(false);
    } catch (err) {
      setExpSubmitError(err.message);
    }
  };

  const getVehicleReg = (id) => vehicles.find(v => v.id === id)?.registrationNumber || 'Unknown';

  return (
    <div className="fuel-expenses-page">
      {/* Total Operational Cost Banner */}
      <div className="operational-cost-banner">
        <span className="cost-banner-formula">Total Operational Cost (Auto) = Fuel + Maint</span>
        <span className="cost-banner-value">₹{totals.operational.toLocaleString('en-IN')}</span>
      </div>

      {/* Section 1: Fuel Logs */}
      <div className="expenses-section">
        <div className="expenses-section-header">
          <h2 className="expenses-section-title">Fuel Logs</h2>
          <button className="btn btn-accent btn-sm" onClick={() => setShowFuelModal(true)}>
            + Log Fuel
          </button>
        </div>

        <div className="maintenance-table-wrapper">
          {fuelLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⛽</div>
              <div className="empty-state-text">No fuel logs recorded yet.</div>
            </div>
          ) : (
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Date</th>
                  <th>Liters</th>
                  <th>Fuel Cost</th>
                </tr>
              </thead>
              <tbody>
                {[...fuelLogs]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 700 }}>{getVehicleReg(log.vehicleId)}</td>
                      <td>{new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ fontWeight: 500 }}>{log.liters} L</td>
                      <td className="maintenance-cost">₹{Number(log.totalCost).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Section 2: Other Expenses */}
      <div className="expenses-section">
        <div className="expenses-section-header">
          <h2 className="expenses-section-title">Other Expenses (Toll / Misc)</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowExpenseModal(true)}>
            + Add Expense
          </button>
        </div>

        <div className="maintenance-table-wrapper">
          {groupedExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎟️</div>
              <div className="empty-state-text">No other expenses logged yet.</div>
            </div>
          ) : (
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Vehicle</th>
                  <th>Toll</th>
                  <th>Other</th>
                  <th>Maint. (Linked)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {groupedExpenses.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{row.tripId.slice(0, 6).toUpperCase()}</td>
                    <td>{getVehicleReg(row.vehicleId)}</td>
                    <td>₹{row.toll.toLocaleString('en-IN')}</td>
                    <td>₹{row.other.toLocaleString('en-IN')}</td>
                    <td>₹{row.maintenance.toLocaleString('en-IN')}</td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
                        ₹{row.total.toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Fuel Modal */}
      {showFuelModal && (
        <div className="modal-overlay" onClick={() => setShowFuelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Log Fuel</h3>
              <button className="modal-close" onClick={() => setShowFuelModal(false)}>✕</button>
            </div>

            {fuelSubmitError && <div className="alert alert-error"><span>✗</span> {fuelSubmitError}</div>}

            <form onSubmit={handleFuelSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Vehicle *</label>
                <select
                  className={`form-input ${fuelErrors.vehicleId ? 'error' : ''}`}
                  value={fuelVehicleId}
                  onChange={(e) => { setFuelVehicleId(e.target.value); setFuelErrors(p => ({ ...p, vehicleId: undefined })); }}
                >
                  <option value="">Select vehicle...</option>
                  {activeVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.name}
                    </option>
                  ))}
                </select>
                {fuelErrors.vehicleId && <div className="field-error">{fuelErrors.vehicleId}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className={`form-input ${fuelErrors.date ? 'error' : ''}`}
                  value={fuelDate}
                  onChange={(e) => { setFuelDate(e.target.value); setFuelErrors(p => ({ ...p, date: undefined })); }}
                />
                {fuelErrors.date && <div className="field-error">{fuelErrors.date}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Liters *</label>
                <input
                  type="number"
                  className={`form-input ${fuelErrors.liters ? 'error' : ''}`}
                  placeholder="e.g., 42"
                  value={fuelLiters}
                  onChange={(e) => { setFuelLiters(e.target.value); setFuelErrors(p => ({ ...p, liters: undefined })); }}
                  min="0"
                />
                {fuelErrors.liters && <div className="field-error">{fuelErrors.liters}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Cost Per Liter (₹) *</label>
                <input
                  type="number"
                  className={`form-input ${fuelErrors.costPerLiter ? 'error' : ''}`}
                  placeholder="e.g., 105"
                  value={fuelCostPerLiter}
                  onChange={(e) => { setFuelCostPerLiter(e.target.value); setFuelErrors(p => ({ ...p, costPerLiter: undefined })); }}
                  min="0"
                />
                {fuelErrors.costPerLiter && <div className="field-error">{fuelErrors.costPerLiter}</div>}
              </div>

              {fuelLiters && fuelCostPerLiter && (
                <div className="form-info-text">
                  Estimated Total Cost: <strong>₹{(Number(fuelLiters) * Number(fuelCostPerLiter)).toLocaleString('en-IN')}</strong>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowFuelModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent">Log Fuel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Expense</h3>
              <button className="modal-close" onClick={() => setShowExpenseModal(false)}>✕</button>
            </div>

            {expSubmitError && <div className="alert alert-error"><span>✗</span> {expSubmitError}</div>}

            <form onSubmit={handleExpenseSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Trip Link (Optional)</label>
                <select
                  className="form-input"
                  value={expTripId}
                  onChange={(e) => handleTripChangeInExpense(e.target.value)}
                >
                  <option value="">No link (General vehicle expense)</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.id.slice(0, 6).toUpperCase()} : {t.source} ➔ {t.destination}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle *</label>
                <select
                  className="form-input"
                  value={expVehicleId}
                  onChange={(e) => setExpVehicleId(e.target.value)}
                  disabled={!!expTripId} // Auto-locked if trip selected
                >
                  <option value="">Select vehicle...</option>
                  {activeVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Expense Type *</label>
                <select
                  className="form-input"
                  value={expType}
                  onChange={(e) => setExpType(e.target.value)}
                >
                  <option value="Toll">Toll</option>
                  <option value="Misc">Misc</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  className={`form-input ${expErrors.amount ? 'error' : ''}`}
                  placeholder="e.g., 120"
                  value={expAmount}
                  onChange={(e) => { setExpAmount(e.target.value); setExpErrors(p => ({ ...p, amount: undefined })); }}
                  min="0"
                />
                {expErrors.amount && <div className="field-error">{expErrors.amount}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className={`form-input ${expErrors.date ? 'error' : ''}`}
                  value={expDate}
                  onChange={(e) => { setExpDate(e.target.value); setExpErrors(p => ({ ...p, date: undefined })); }}
                />
                {expErrors.date && <div className="field-error">{expErrors.date}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Description / Remarks</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Toll tax details"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelExpenses;
