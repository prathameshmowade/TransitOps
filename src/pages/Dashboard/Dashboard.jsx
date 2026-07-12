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

const nodeCoords = {
  'gandhinagar': { x: 80, y: 50 },
  'ahmedabad': { x: 250, y: 100 },
  'sanand': { x: 150, y: 180 },
  'vatva': { x: 380, y: 140 },
  'naroda': { x: 340, y: 60 },
  'kalol': { x: 80, y: 50 },
  'sarkhej': { x: 250, y: 100 }
};

const getRouteCoordinates = (source, destination, progress) => {
  const src = (source || '').toLowerCase();
  const dest = (destination || '').toLowerCase();

  let pStart = { x: 80, y: 50 };
  let pEnd = { x: 250, y: 100 };

  for (let key in nodeCoords) {
    if (src.includes(key)) pStart = nodeCoords[key];
    if (dest.includes(key)) pEnd = nodeCoords[key];
  }

  return {
    x: pStart.x + (pEnd.x - pStart.x) * (progress / 100),
    y: pStart.y + (pEnd.y - pStart.y) * (progress / 100),
  };
};

const Dashboard = () => {
  const { vehicles, drivers, trips } = useData();

  const [vehicleType, setVehicleType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  // Simulation tick states for active trips
  const [simulationTicks, setSimulationTicks] = useState({});

  const activeDispatchedTrips = useMemo(() => {
    return trips.filter(t => t.status === 'Dispatched');
  }, [trips]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSimulationTicks(prev => {
        const next = { ...prev };
        activeDispatchedTrips.forEach(t => {
          const current = prev[t.id] || 0;
          if (current >= 100) {
            next[t.id] = 0; // wrap around
          } else {
            next[t.id] = current + 3; // increment progress
          }
        });
        return next;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [activeDispatchedTrips]);

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

      {/* Live Operations & GPS Map Widget */}
      <div className="card live-map-card">
        <h3 className="section-title">🗺️ Live Fleet Operations & GPS Tracking</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.2fr', gap: '1.5rem', alignItems: 'center' }}>
          
          {/* SVG Map Container */}
          <div className="svg-map-wrapper" style={{ position: 'relative', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', overflow: 'hidden' }}>
            <svg viewBox="0 0 500 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Connecting Routes */}
              <line x1="80" y1="50" x2="250" y2="100" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="250" y1="100" x2="150" y2="180" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="80" y1="50" x2="150" y2="180" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="250" y1="100" x2="380" y2="140" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="340" y1="60" x2="250" y2="100" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4,4" />

              {/* Hub A: Gandhinagar */}
              <circle cx="80" cy="50" r="7" fill="var(--primary)" />
              <circle cx="80" cy="50" r="13" fill="none" stroke="var(--primary)" strokeWidth="1.5" className="pulse-circle" />
              <text x="80" y="32" textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="bold">Gandhinagar Depot</text>

              {/* Hub B: Ahmedabad */}
              <circle cx="250" cy="100" r="7" fill="var(--success)" />
              <circle cx="250" cy="100" r="13" fill="none" stroke="var(--success)" strokeWidth="1.5" className="pulse-circle" />
              <text x="250" y="82" textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="bold">Ahmedabad Hub</text>

              {/* Hub C: Sanand */}
              <circle cx="150" cy="180" r="7" fill="var(--accent)" />
              <circle cx="150" cy="180" r="13" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="pulse-circle" />
              <text x="150" y="198" textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="bold">Sanand Warehouse</text>

              {/* Hub D: Vatva */}
              <circle cx="380" cy="140" r="7" fill="var(--info)" />
              <circle cx="380" cy="140" r="13" fill="none" stroke="var(--info)" strokeWidth="1.5" className="pulse-circle" />
              <text x="380" y="158" textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="bold">Vatva Depot</text>

              {/* Hub E: Naroda */}
              <circle cx="340" cy="60" r="7" fill="#ec4899" />
              <circle cx="340" cy="60" r="13" fill="none" stroke="#ec4899" strokeWidth="1.5" className="pulse-circle" />
              <text x="340" y="44" textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="bold">Naroda Hub</text>

              {/* Moving Vehicle Dots */}
              {activeDispatchedTrips.map((trip) => {
                const pos = getRouteCoordinates(trip.source, trip.destination, simulationTicks[trip.id] || 0);
                const veh = vehicles.find(v => v.id === trip.vehicleId);
                const reg = veh ? veh.registrationNumber : 'Unknown';

                return (
                  <g key={trip.id}>
                    <circle cx={pos.x} cy={pos.y} r="5" fill="#ef4444" />
                    <circle cx={pos.x} cy={pos.y} r="9" fill="none" stroke="#ef4444" strokeWidth="1.5" className="pulse-circle-fast" />
                    <text x={pos.x} y={pos.y - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="8" fontWeight="bold">
                      {reg}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Sidebar tracker feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '240px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: '0.375rem' }}>
              📡 GPS Live Feed
            </div>
            {activeDispatchedTrips.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
                No active tracking logs. Dispatch a trip to start.
              </div>
            ) : (
              activeDispatchedTrips.map(trip => {
                const veh = vehicles.find(v => v.id === trip.vehicleId);
                const reg = veh ? veh.registrationNumber : 'Unknown';
                const progress = Math.round(simulationTicks[trip.id] || 0);
                return (
                  <div key={trip.id} style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--primary)' }}>{reg}</span>
                      <span style={{ color: 'var(--danger)' }}>{progress}% Route</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trip.source} ➔ {trip.destination}
                    </div>
                    <div style={{ marginTop: '0.375rem', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.6s' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
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
