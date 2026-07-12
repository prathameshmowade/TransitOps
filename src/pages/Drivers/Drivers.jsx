import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { validateDriver, hasErrors } from '../../utils/validators';
import './Drivers.css';

const categoryOptions = ['LMV', 'HMV', 'HPMV', 'HGMV'];
const statusOptions = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

const statusBadge = {
  'Available': 'badge-success',
  'On Trip': 'badge-info',
  'Off Duty': 'badge-neutral',
  'Suspended': 'badge-warning',
};

const maskContact = (num) => {
  if (!num || num.length < 4) return num;
  return num.slice(0, 4) + 'xxxxx' + num.slice(-1);
};

const isLicenseExpired = (expiry) => {
  if (!expiry) return false;
  return new Date(expiry) < new Date();
};

const formatExpiry = (expiry) => {
  if (!expiry) return '—';
  const d = new Date(expiry);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const expired = isLicenseExpired(expiry);
  return `${mm}/${yyyy}${expired ? ' EXPIRED' : ''}`;
};

const getSafetyClass = (score) => {
  if (score >= 85) return 'safety-high';
  if (score >= 60) return 'safety-medium';
  return 'safety-low';
};

const Drivers = () => {
  const { drivers, trips, addDriver, updateDriver, deleteDriver } = useData();

  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Count completed trips per driver
  const tripCounts = useMemo(() => {
    const counts = {};
    trips.forEach((t) => {
      if (t.driverId && t.status === 'Completed') {
        counts[t.driverId] = (counts[t.driverId] || 0) + 1;
      }
    });
    return counts;
  }, [trips]);

  // Stats
  const stats = useMemo(() => ({
    available: drivers.filter((d) => d.status === 'Available').length,
    onTrip: drivers.filter((d) => d.status === 'On Trip').length,
    offDuty: drivers.filter((d) => d.status === 'Off Duty').length,
    suspended: drivers.filter((d) => d.status === 'Suspended').length,
  }), [drivers]);

  const openAddModal = () => {
    setEditingDriver(null);
    setFormData({
      name: '', licenseNumber: '', licenseCategory: 'LMV',
      licenseExpiry: '', contactNumber: '', safetyScore: '80', status: 'Available',
    });
    setFormErrors({});
    setSubmitError('');
    setShowModal(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name, licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory, licenseExpiry: driver.licenseExpiry,
      contactNumber: driver.contactNumber, safetyScore: String(driver.safetyScore),
      status: driver.status,
    });
    setFormErrors({});
    setSubmitError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDriver(null);
    setFormErrors({});
    setSubmitError('');
  };

  const handleChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setFormErrors((p) => ({ ...p, [field]: undefined }));
    setSubmitError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateDriver(formData);
    if (hasErrors(errors)) { setFormErrors(errors); return; }

    try {
      const payload = {
        name: formData.name.trim(),
        licenseNumber: formData.licenseNumber.trim().toUpperCase(),
        licenseCategory: formData.licenseCategory,
        licenseExpiry: formData.licenseExpiry,
        contactNumber: formData.contactNumber.trim(),
        safetyScore: Number(formData.safetyScore) || 80,
        status: formData.status,
      };

      if (editingDriver) {
        updateDriver(editingDriver.id, payload);
      } else {
        addDriver(payload);
      }
      closeModal();
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteDriver(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="drivers-page">
      {/* Toolbar */}
      <div className="drivers-toolbar">
        <button className="btn-add-driver" onClick={openAddModal}>+ Add Driver</button>
      </div>

      {/* Table */}
      <div className="drivers-table-wrapper">
        {drivers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-text">No drivers registered</div>
          </div>
        ) : (
          <table className="drivers-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>License No</th>
                <th>Category</th>
                <th>Expiry</th>
                <th>Contact</th>
                <th>Trip Compl.</th>
                <th>Safety</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const expired = isLicenseExpired(driver.licenseExpiry);
                return (
                  <tr key={driver.id}>
                    <td><span className="driver-name">{driver.name}</span></td>
                    <td><span className="license-number">{driver.licenseNumber}</span></td>
                    <td>{driver.licenseCategory}</td>
                    <td>
                      <span className={expired ? 'expiry-expired' : 'expiry-valid'}>
                        {formatExpiry(driver.licenseExpiry)}
                      </span>
                    </td>
                    <td><span className="contact-masked">{maskContact(driver.contactNumber)}</span></td>
                    <td>{tripCounts[driver.id] || 0}</td>
                    <td>
                      <span className={`safety-score ${getSafetyClass(driver.safetyScore)}`}>
                        {driver.safetyScore}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge[driver.status] || 'badge-neutral'}`}>
                        {driver.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-edit" onClick={() => openEditModal(driver)}>Edit</button>
                        <button className="btn-action btn-delete" onClick={() => setDeleteTarget(driver)}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Toggle Stats */}
      <div className="drivers-toggle-stats">
        <span className="toggle-stat-label">Toggle Stat:</span>
        <span className="toggle-stat-badge toggle-available">Available ({stats.available})</span>
        <span className="toggle-stat-badge toggle-on-trip">On Trip ({stats.onTrip})</span>
        <span className="toggle-stat-badge toggle-off-duty">Off Duty ({stats.offDuty})</span>
        <span className="toggle-stat-badge toggle-suspended">Suspended ({stats.suspended})</span>
      </div>

      {/* Rule Note */}
      <div className="drivers-rule-note">
        <span>🚫</span>
        <span><strong>Rule:</strong> Expired license or Suspended status → blocked from trip assignment.</span>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            {submitError && <div className="alert alert-error"><span>✗</span> {submitError}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className={`form-input ${formErrors.name ? 'error' : ''}`} placeholder="e.g., Alex Sharma"
                    value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                  {formErrors.name && <div className="field-error">{formErrors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">License Number *</label>
                  <input className={`form-input ${formErrors.licenseNumber ? 'error' : ''}`} placeholder="DL-2026-001"
                    value={formData.licenseNumber || ''} onChange={(e) => handleChange('licenseNumber', e.target.value.toUpperCase())} />
                  {formErrors.licenseNumber && <div className="field-error">{formErrors.licenseNumber}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">License Category *</label>
                  <select className={`form-input ${formErrors.licenseCategory ? 'error' : ''}`}
                    value={formData.licenseCategory || 'LMV'} onChange={(e) => handleChange('licenseCategory', e.target.value)}>
                    {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formErrors.licenseCategory && <div className="field-error">{formErrors.licenseCategory}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">License Expiry *</label>
                  <input type="date" className={`form-input ${formErrors.licenseExpiry ? 'error' : ''}`}
                    value={formData.licenseExpiry || ''} onChange={(e) => handleChange('licenseExpiry', e.target.value)} />
                  {formErrors.licenseExpiry && <div className="field-error">{formErrors.licenseExpiry}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Number *</label>
                  <input className={`form-input ${formErrors.contactNumber ? 'error' : ''}`} placeholder="9876543210"
                    value={formData.contactNumber || ''} onChange={(e) => handleChange('contactNumber', e.target.value)} maxLength={10} />
                  {formErrors.contactNumber && <div className="field-error">{formErrors.contactNumber}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Safety Score (0-100)</label>
                  <input type="number" className="form-input" placeholder="80" min="0" max="100"
                    value={formData.safetyScore || ''} onChange={(e) => handleChange('safetyScore', e.target.value)} />
                </div>
              </div>
              {editingDriver && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={formData.status || 'Available'}
                    onChange={(e) => handleChange('status', e.target.value)}>
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingDriver ? 'Save Changes' : 'Add Driver'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Driver</h3>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
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

export default Drivers;
