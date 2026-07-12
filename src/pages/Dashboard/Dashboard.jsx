import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import './Dashboard.css';

const statusBadgeMap = {
  'Draft': 'badge-info',
  'Dispatched': 'badge-warning',
  'On Trip': 'badge-success',
  'Completed': 'badge-success',
  'Cancelled': 'badge-danger',
};

const kpiColors = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

const Dashboard = () => {
  const { vehicles, drivers, trips } = useData();

  const [vehicleType, setVehicleType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  // ── Compute KPIs from live data ──
  const filteredVehicles = useMemo(() => {
    let v = vehicles;
    if (vehicleType !== 'All') v = v.filter((x) => x.type === vehicleType);
    if (statusFilter !== 'All') v = v.filter((x) => x.status === statusFilter);
    return v;
  }, [vehicles, vehicleType, statusFilter]);

  const activeVehicles = filteredVehicles.filter((v) => v.status !== 'Retired').length;
  const availableVehicles = filteredVehicles.filter((v) => v.status === 'Available').length;
  const inMaintenance = filteredVehicles.filter((v) => v.status === 'In Shop').length;
  const activeTrips = trips.filter((t) => t.status === 'Dispatched').length;
  const pendingTrips = trips.filter((t) => t.status === 'Draft').length;
  const driversOnDuty = drivers.filter((d) => d.status === 'On Trip').length;
  const fleetUtil = activeVehicles > 0
    ? Math.round(((activeVehicles - availableVehicles) / activeVehicles) * 100)
    : 0;

  const kpis = [
    { label: 'Active Vehicles', value: String(activeVehicles).padStart(2, '0') },
    { label: 'Available Vehicles', value: String(availableVehicles).padStart(2, '0') },
    { label: 'In Maintenance', value: String(inMaintenance).padStart(2, '0') },
    { label: 'Active Trips', value: String(activeTrips).padStart(2, '0') },
    { label: 'Pending Trips', value: String(pendingTrips).padStart(2, '0') },
    { label: 'Drivers on Duty', value: String(driversOnDuty).padStart(2, '0') },
    { label: 'Fleet Utilization', value: `${fleetUtil}%` },
  ];

  // ── Vehicle Status chart ──
  const totalVehicles = vehicles.length || 1;
  const vehicleStatusData = [
    { label: 'Available', cls: 'bar-available', count: vehicles.filter((v) => v.status === 'Available').length },
    { label: 'On Trip', cls: 'bar-on-trip', count: vehicles.filter((v) => v.status === 'On Trip').length },
    { label: 'In Shop', cls: 'bar-in-shop', count: vehicles.filter((v) => v.status === 'In Shop').length },
    { label: 'Retired', cls: 'bar-retired', count: vehicles.filter((v) => v.status === 'Retired').length },
  ];

  // ── Recent Trips ──
  const recentTrips = useMemo(() => {
    return [...trips]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }, [trips]);

  const getVehicleReg = (id) => vehicles.find((v) => v.id === id)?.registrationNumber || '—';
  const getDriverName = (id) => drivers.find((d) => d.id === id)?.name?.split(' ')[0] || '—';

  // Unique vehicle types for filter dropdown
  const vehicleTypes = useMemo(() => [...new Set(vehicles.map((v) => v.type))], [vehicles]);

  return (
    <div className="dashboard">
      {/* Filters */}
      <div className="dashboard-filters">
        <span className="filter-label">Filters:</span>
        <select className="filter-select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
          <option value="All">Vehicle Type: All</option>
          {vehicleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">Status: All</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>
        <select className="filter-select" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
          <option value="All">Region: All</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="West">West</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div className="kpi-card" key={i} style={{ '--kpi-color': kpiColors[i] }}>
            <span className="kpi-label">{kpi.label}</span>
            <span className="kpi-value">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom">
        {/* Recent Trips */}
        <div className="card">
          <h3 className="section-title">Recent Trips</h3>
          {recentTrips.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗺️</div>
              <div className="empty-state-text">No trips yet</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Distance</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip) => (
                  <tr key={trip.id}>
                    <td style={{ fontWeight: 600 }}>{trip.id.slice(0, 6).toUpperCase()}</td>
                    <td>{getVehicleReg(trip.vehicleId)}</td>
                    <td>{getDriverName(trip.driverId)}</td>
                    <td>
                      <span className={`badge ${statusBadgeMap[trip.status] || 'badge-neutral'}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td>{trip.actualDistance ? `${trip.actualDistance} km` : trip.plannedDistance ? `~${trip.plannedDistance} km` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Vehicle Status */}
        <div className="card">
          <h3 className="section-title">Vehicle Status</h3>
          <div className="status-chart">
            {vehicleStatusData.map((s, i) => (
              <div className="status-row" key={i}>
                <span className="status-label">{s.label}</span>
                <div className="status-bar-track">
                  <div
                    className={`status-bar-fill ${s.cls}`}
                    style={{ width: `${(s.count / totalVehicles) * 100}%` }}
                  />
                </div>
                <span className="status-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
