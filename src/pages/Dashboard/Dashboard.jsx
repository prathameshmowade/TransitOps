import React, { useState } from 'react';
import './Dashboard.css';

const mockTrips = [
  { id: '#TR001', vehicle: 'VAN-05', driver: 'Alex', status: 'On Trip', kpi: '45 km' },
  { id: '#TR003', vehicle: 'TRV-12', driver: 'Ivan', status: 'Completed', kpi: '—' },
  { id: '#TR001', vehicle: 'MTAT-04', driver: 'Priya', status: 'Dispatched', kpi: 'In Km' },
  { id: '#TR001', vehicle: '—', driver: '—', status: 'Draft', kpi: 'Awaiting vehicle' },
];

const vehicleStatuses = [
  { label: 'Available', className: 'available', percent: 79 },
  { label: 'On Trip', className: 'on-trip', percent: 55 },
  { label: 'In Shop', className: 'in-shop', percent: 30 },
  { label: 'Retired', className: 'retired', percent: 10 },
];

const getStatusClass = (status) => {
  const map = {
    'On Trip': 'on-trip',
    'Completed': 'completed',
    'Dispatched': 'dispatched',
    'Draft': 'draft',
    'Cancelled': 'cancelled',
  };
  return map[status] || '';
};

const Dashboard = () => {
  const [vehicleType, setVehicleType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  const kpis = [
    { label: 'Active Vehicles', value: '53' },
    { label: 'Available Vehicles', value: '42' },
    { label: 'Vehicles in Maintenance', value: '05' },
    { label: 'Active Trips', value: '18' },
    { label: 'Pending Trips', value: '09' },
    { label: 'Drivers on Duty', value: '26' },
    { label: 'Fleet Utilization', value: '81%' },
  ];

  return (
    <div className="dashboard">
      {/* Filters */}
      <div className="dashboard-filters">
        <span className="filter-label">Filters:</span>
        <select
          className="filter-select"
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
        >
          <option value="All">Vehicle Type: All</option>
          <option value="Van">Van</option>
          <option value="Truck">Truck</option>
          <option value="Trailer">Trailer</option>
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">Status: All</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>
        <select
          className="filter-select"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
        >
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
          <div className="kpi-card" key={i}>
            <span className="kpi-card-label">{kpi.label}</span>
            <span className="kpi-card-value">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom">
        {/* Recent Trips */}
        <div className="recent-trips">
          <h3 className="section-title">Recent Trips</h3>
          <table className="trips-table">
            <thead>
              <tr>
                <th>TRD</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Status</th>
                <th>KPI</th>
              </tr>
            </thead>
            <tbody>
              {mockTrips.map((trip, i) => (
                <tr key={i}>
                  <td>{trip.id}</td>
                  <td>{trip.vehicle}</td>
                  <td>{trip.driver}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td>{trip.kpi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vehicle Status Chart */}
        <div className="vehicle-status">
          <h3 className="section-title">Vehicle Status</h3>
          <div className="status-chart">
            {vehicleStatuses.map((s, i) => (
              <div className="status-row" key={i}>
                <span className="status-label">{s.label}</span>
                <div className="status-bar-track">
                  <div
                    className={`status-bar-fill ${s.className}`}
                    style={{ width: `${s.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
