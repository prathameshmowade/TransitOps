import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { validateMaintenance, hasErrors } from '../../utils/validators';
import './Maintenance.css';

const statusBadge = {
  'In Progress': 'badge-warning',
  'Completed': 'badge-success',
};

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

  // Dropdown list: only show active (non-retired) vehicles for maintenance.
  // Note: Vehicles that are already "In Shop" can have new maintenance logs, but typically we add Available/On Trip ones.
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
        description: description.trim(),
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
      {/* Left Column: Logs List */}
      <div className="maintenance-list-section">
        <h2 className="section-title">Maintenance Logs</h2>

        <div className="maintenance-table-wrapper">
          {maintenance.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔧</div>
              <div className="empty-state-text">No maintenance records found</div>
            </div>
          ) : (
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service Type</th>
                  <th>Description</th>
                  <th>Cost</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...maintenance]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{getVehicleReg(log.vehicleId)}</td>
                      <td style={{ fontWeight: 500 }}>{log.type}</td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.description}>
                        {log.description || '—'}
                      </td>
                      <td className="maintenance-cost">₹{log.cost.toLocaleString('en-IN')}</td>
                      <td>{log.startDate}</td>
                      <td>{log.endDate || '—'}</td>
                      <td>
                        <span className={`badge ${statusBadge[log.status] || 'badge-neutral'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        {log.status === 'In Progress' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => completeMaintenance(log.id)}
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Business Rule Note */}
        <div className="maintenance-rule-note">
          <span>ℹ️</span>
          <span>
            <strong>Rule:</strong> Creating a maintenance record switches vehicle status to <strong>In Shop</strong> (hidden from dispatcher selection pool). Closing/resolving it restores status to <strong>Available</strong>.
          </span>
        </div>
      </div>

      {/* Right Column: Create Log Form */}
      <div className="maintenance-form-panel">
        <h3 className="maintenance-form-title">Create Log</h3>

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
              placeholder="e.g., Oil Change, Tire Rotation"
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
              placeholder="e.g., 3500"
              value={cost}
              onChange={(e) => { setCost(e.target.value); setFormErrors(p => ({ ...p, cost: undefined })); }}
              min="0"
            />
            {formErrors.cost && <div className="field-error">{formErrors.cost}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input
              type="date"
              className={`form-input ${formErrors.startDate ? 'error' : ''}`}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setFormErrors(p => ({ ...p, startDate: undefined })); }}
            />
            {formErrors.startDate && <div className="field-error">{formErrors.startDate}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Description / Remarks</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              placeholder="Enter service details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            Create Maintenance Log
          </button>
        </form>
      </div>
    </div>
  );
};

export default Maintenance;
