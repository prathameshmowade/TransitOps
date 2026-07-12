import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { validateVehicle, hasErrors } from '../../utils/validators';
import './Fleet.css';

const vehicleTypes = ['Van', 'Truck', 'Bus', 'Mini', 'Trailer'];
const statusOptions = ['Available', 'On Trip', 'In Shop', 'Retired'];

const statusBadge = {
  'Available': 'badge-success',
  'On Trip': 'badge-warning',
  'In Shop': 'badge-info',
  'Retired': 'badge-danger',
};

const formatCurrency = (num) => {
  return '₹' + Number(num).toLocaleString('en-IN');
};

const formatCapacity = (kg) => {
  if (kg >= 1000) return `${(kg / 1000).toFixed(kg % 1000 === 0 ? 0 : 1)} Ton`;
  return `${kg} kg`;
};

const Fleet = () => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useData();

  // Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];
    if (typeFilter !== 'All') result = result.filter((v) => v.type === typeFilter);
    if (statusFilter !== 'All') result = result.filter((v) => v.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (v) =>
          v.registrationNumber.toLowerCase().includes(q) ||
          v.name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [vehicles, typeFilter, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'Available').length,
    onTrip: vehicles.filter((v) => v.status === 'On Trip').length,
    inShop: vehicles.filter((v) => v.status === 'In Shop').length,
    retired: vehicles.filter((v) => v.status === 'Retired').length,
  }), [vehicles]);

  // Open modal
  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      registrationNumber: '',
      name: '',
      type: 'Van',
      maxLoadCapacity: '',
      odometer: '0',
      acquisitionCost: '',
      status: 'Available',
    });
    setFormErrors({});
    setSubmitError('');
    setShowModal(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      maxLoadCapacity: String(vehicle.maxLoadCapacity),
      odometer: String(vehicle.odometer),
      acquisitionCost: String(vehicle.acquisitionCost),
      status: vehicle.status,
    });
    setFormErrors({});
    setSubmitError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setFormData({});
    setFormErrors({});
    setSubmitError('');
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateVehicle(formData, vehicles, editingVehicle?.id);
    if (hasErrors(errors)) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        registrationNumber: formData.registrationNumber.trim(),
        name: formData.name.trim(),
        type: formData.type,
        maxLoadCapacity: Number(formData.maxLoadCapacity),
        odometer: Number(formData.odometer) || 0,
        acquisitionCost: Number(formData.acquisitionCost),
        status: formData.status,
      };

      if (editingVehicle) {
        updateVehicle(editingVehicle.id, payload);
      } else {
        addVehicle(payload);
      }
      closeModal();
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const handleDelete = (vehicle) => {
    setDeleteTarget(vehicle);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="fleet-page">
      {/* Stats */}
      <div className="fleet-stats">
        <div className="fleet-stat">Total: <span className="fleet-stat-count">{stats.total}</span></div>
        <div className="fleet-stat">Available: <span className="fleet-stat-count" style={{ color: 'var(--success)' }}>{stats.available}</span></div>
        <div className="fleet-stat">On Trip: <span className="fleet-stat-count" style={{ color: 'var(--accent)' }}>{stats.onTrip}</span></div>
        <div className="fleet-stat">In Shop: <span className="fleet-stat-count" style={{ color: 'var(--info)' }}>{stats.inShop}</span></div>
        <div className="fleet-stat">Retired: <span className="fleet-stat-count" style={{ color: 'var(--danger)' }}>{stats.retired}</span></div>
      </div>

      {/* Toolbar */}
      <div className="fleet-toolbar">
        <div className="fleet-filters">
          <select className="fleet-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">Type: All</option>
            {vehicleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="fleet-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">Status: All</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="text"
            className="fleet-search"
            placeholder="Search reg. no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-add-vehicle" onClick={openAddModal}>
          + Add Vehicle
        </button>
      </div>

      {/* Table */}
      <div className="fleet-table-wrapper">
        {filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚛</div>
            <div className="empty-state-text">No vehicles found</div>
          </div>
        ) : (
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Reg. No. / Unique</th>
                <th>Name/Model</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Odometer</th>
                <th>Acq. Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td><span className="reg-number">{vehicle.registrationNumber}</span></td>
                  <td><span className="vehicle-name">{vehicle.name}</span></td>
                  <td>{vehicle.type}</td>
                  <td><span className="capacity-text">{formatCapacity(vehicle.maxLoadCapacity)}</span></td>
                  <td>{Number(vehicle.odometer).toLocaleString('en-IN')}</td>
                  <td><span className="cost-text">{formatCurrency(vehicle.acquisitionCost)}</span></td>
                  <td>
                    <span className={`badge ${statusBadge[vehicle.status] || 'badge-neutral'}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-edit" onClick={() => openEditModal(vehicle)}>Edit</button>
                      <button className="btn-action btn-delete" onClick={() => handleDelete(vehicle)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Business Rule Note */}
      <div className="fleet-rule-note">
        <span className="fleet-rule-icon">⚠️</span>
        <span>
          <strong>Rule:</strong> Registration No. must be unique — Retired or In-Shop vehicles are hidden from Trip Dispatcher.
        </span>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {submitError && <div className="alert alert-error"><span>✗</span> {submitError}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Registration Number *</label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.registrationNumber ? 'error' : ''}`}
                    placeholder="e.g., VAN-05"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => handleChange('registrationNumber', e.target.value.toUpperCase())}
                  />
                  {formErrors.registrationNumber && <div className="field-error">{formErrors.registrationNumber}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Name/Model *</label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="e.g., Transit Van 05"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                  {formErrors.name && <div className="field-error">{formErrors.name}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select
                    className={`form-input ${formErrors.type ? 'error' : ''}`}
                    value={formData.type || 'Van'}
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    {vehicleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {formErrors.type && <div className="field-error">{formErrors.type}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Max Load Capacity (kg) *</label>
                  <input
                    type="number"
                    className={`form-input ${formErrors.maxLoadCapacity ? 'error' : ''}`}
                    placeholder="e.g., 500"
                    value={formData.maxLoadCapacity || ''}
                    onChange={(e) => handleChange('maxLoadCapacity', e.target.value)}
                    min="0"
                  />
                  {formErrors.maxLoadCapacity && <div className="field-error">{formErrors.maxLoadCapacity}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Odometer (km)</label>
                  <input
                    type="number"
                    className={`form-input ${formErrors.odometer ? 'error' : ''}`}
                    placeholder="e.g., 12450"
                    value={formData.odometer || ''}
                    onChange={(e) => handleChange('odometer', e.target.value)}
                    min="0"
                  />
                  {formErrors.odometer && <div className="field-error">{formErrors.odometer}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Acquisition Cost (₹) *</label>
                  <input
                    type="number"
                    className={`form-input ${formErrors.acquisitionCost ? 'error' : ''}`}
                    placeholder="e.g., 850000"
                    value={formData.acquisitionCost || ''}
                    onChange={(e) => handleChange('acquisitionCost', e.target.value)}
                    min="0"
                  />
                  {formErrors.acquisitionCost && <div className="field-error">{formErrors.acquisitionCost}</div>}
                </div>
              </div>

              {editingVehicle && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={formData.status || 'Available'}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Vehicle</h3>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Are you sure you want to delete <strong>{deleteTarget.registrationNumber}</strong> ({deleteTarget.name})?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
