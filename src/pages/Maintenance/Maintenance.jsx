import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { validateMaintenance, hasErrors } from '../../utils/validators';
import './Maintenance.css';

const Maintenance = () => {
  const {
    maintenance,
    vehicles,
    createMaintenance,
    completeMaintenance,
  } = useData();

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Dropdown list: show all non-retired vehicles
  const activeVehicles = useMemo(() => {
    return vehicles.filter(v => v.status !== 'Retired');
  }, [vehicles]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');

    const data = {
      vehicleId: selectedVehicleId,
      type,
      description,
      cost: cost ? Number(cost) : '',
      startDate,
    };

    const errors = validateMaintenance(data);
    if (hasErrors(errors)) {
      setFormErrors(errors);
      return;
    }

    try {
      createMaintenance({
        vehicleId: selectedVehicleId,
        type: type.trim(),
        description: description.trim() || `${type.trim()} service`,
        cost: Number(cost),
        startDate,
      });

      // Clear Form
      setSelectedVehicleId('');
      setType('');
      setDescription('');
      setCost('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setFormErrors({});
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const getVehicleReg = (id) => vehicles.find(v => v.id === id)?.registrationNumber || 'Unknown';

  return (
    <div className="maintenance-page">
      {/* Left Column: Log Service Record */}
      <div className="maintenance-form-panel">
        <h3 className="maintenance-form-title">Log Service Record</h3>

        {submitError && <div className="alert alert-error"><span>✗</span> {submitError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Vehicle *</label>
            <select
              className={`form-input ${formErrors.vehicleId ? 'error' : ''}`}
              value={selectedVehicleId}
              onChange={(e) => { setSelectedVehicleId(e.target.value); setFormErrors(p => ({ ...p, vehicleId: undefined })); }}
            >
              <option value="">Select vehicle...</option>
              {activeVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} — {v.name} ({v.status})
                </option>
              ))}
            </select>
            {formErrors.vehicleId && <div className="field-error">{formErrors.vehicleId}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Service Type *</label>
            <input
              type="text"
              className={`form-input ${formErrors.type ? 'error' : ''}`}
              placeholder="e.g., Oil Change"
              value={type}
              onChange={(e) => { setType(e.target.value); setFormErrors(p => ({ ...p, type: undefined })); }}
            />
            {formErrors.type && <div className="field-error">{formErrors.type}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Cost (₹) *</label>
            <input
              type="number"
              className={`form-input ${formErrors.cost ? 'error' : ''}`}
              placeholder="e.g., 2500"
              value={cost}
              onChange={(e) => { setCost(e.target.value); setFormErrors(p => ({ ...p, cost: undefined })); }}
              min="0"
            />
            {formErrors.cost && <div className="field-error">{formErrors.cost}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className={`form-input ${formErrors.startDate ? 'error' : ''}`}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setFormErrors(p => ({ ...p, startDate: undefined })); }}
            />
            {formErrors.startDate && <div className="field-error">{formErrors.startDate}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <input
              type="text"
              className="form-input"
              value="Active"
              disabled
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Description</label>
            <textarea
              className="form-input"
              style={{ minHeight: '60px', resize: 'vertical' }}
              placeholder="e.g., Coolant replacement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-save-maintenance">
            Save
          </button>
        </form>

        {/* Mockup Flow Visualization */}
        <div className="maintenance-flow-diagram">
          <div className="flow-step-line">
            <span style={{ color: 'var(--success)' }}>Available</span>
            <div className="flow-arrow">
              <span className="flow-text-small">creating active record</span>
            </div>
            <span style={{ color: 'var(--warning)' }}>In Shop</span>
          </div>

          <div className="flow-step-line">
            <span style={{ color: 'var(--warning)' }}>In Shop</span>
            <div className="flow-arrow">
              <span className="flow-text-small">closing record (unless retired)</span>
            </div>
            <span style={{ color: 'var(--success)' }}>Available</span>
          </div>

          <div className="maintenance-footnote">
            <strong>Note:</strong> In Shop vehicles are removed from the dispatch pool.
          </div>
        </div>
      </div>

      {/* Right Column: Service Log */}
      <div className="maintenance-list-section">
        <h2 className="live-board-title">Service Log</h2>

        <div className="maintenance-table-wrapper">
          {maintenance.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔧</div>
              <div className="empty-state-text">No service logs logged yet.</div>
            </div>
          ) : (
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...maintenance]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((log) => {
                    const isOngoing = log.status === 'In Progress' || log.status === 'In Shop';
                    const badgeText = isOngoing ? 'In Shop' : 'Completed';
                    const badgeClass = isOngoing ? 'badge-warning' : 'badge-success';

                    return (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 700 }}>{getVehicleReg(log.vehicleId)}</td>
                        <td>{log.type}</td>
                        <td className="maintenance-cost">₹{Number(log.cost).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`badge ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </td>
                        <td>
                          {isOngoing && (
                            <button
                              className="btn-resolve-maintenance"
                              onClick={() => completeMaintenance(log.id)}
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
