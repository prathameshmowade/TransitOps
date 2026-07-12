import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import './Analytics.css';

const formatCurrency = (val) => {
  return '₹' + Number(val).toLocaleString('en-IN');
};

const Analytics = () => {
  const { vehicles, trips, fuelLogs, maintenance } = useData();

  // ── Metrics Calculations ──
  const metrics = useMemo(() => {
    // 1. Fuel Efficiency (distance / fuel)
    const completedTripsWithFuel = trips.filter(t => t.status === 'Completed' && t.fuelConsumed > 0);
    const totalDistance = completedTripsWithFuel.reduce((sum, t) => sum + (t.actualDistance || 0), 0);
    const totalFuel = completedTripsWithFuel.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
    const fuelEfficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(1) : '0.0';

    // 2. Fleet Utilization
    const activeVehicles = vehicles.filter(v => v.status !== 'Retired');
    const availableVehicles = vehicles.filter(v => v.status === 'Available');
    const fleetUtil = activeVehicles.length > 0
      ? Math.round(((activeVehicles.length - availableVehicles.length) / activeVehicles.length) * 100)
      : 0;

    // 3. Operational Cost (Fuel + Maintenance)
    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.totalCost, 0);
    const totalMaintCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
    const totalOpCost = totalFuelCost + totalMaintCost;

    return {
      fuelEfficiency,
      fleetUtil,
      totalOpCost,
      totalFuelCost,
      totalMaintCost,
    };
  }, [vehicles, trips, fuelLogs, maintenance]);

  // ── Vehicle ROI Table Data ──
  const vehicleROIList = useMemo(() => {
    return vehicles.map(vehicle => {
      // Revenue from completed trips using this vehicle
      const vehicleRevenue = trips
        .filter(t => t.vehicleId === vehicle.id && t.status === 'Completed')
        .reduce((sum, t) => sum + (t.revenue || 0), 0);

      // Fuel cost for this vehicle
      const vehicleFuel = fuelLogs
        .filter(f => f.vehicleId === vehicle.id)
        .reduce((sum, f) => sum + f.totalCost, 0);

      // Maintenance cost for this vehicle
      const vehicleMaint = maintenance
        .filter(m => m.vehicleId === vehicle.id)
        .reduce((sum, m) => sum + m.cost, 0);

      const netProfit = vehicleRevenue - (vehicleFuel + vehicleMaint);
      const acqCost = vehicle.acquisitionCost || 1;
      const roi = ((netProfit / acqCost) * 100).toFixed(1);

      return {
        ...vehicle,
        revenue: vehicleRevenue,
        fuelCost: vehicleFuel,
        maintCost: vehicleMaint,
        netProfit,
        roi,
      };
    });
  }, [vehicles, trips, fuelLogs, maintenance]);

  // Average ROI
  const avgROI = useMemo(() => {
    const activeV = vehicleROIList.filter(v => v.status !== 'Retired');
    if (activeV.length === 0) return '0.0';
    const sum = activeV.reduce((total, v) => total + Number(v.roi), 0);
    return (sum / activeV.length).toFixed(1);
  }, [vehicleROIList]);

  // ── Monthly Revenue / Expenses Data (Chart representation) ──
  const chartData = useMemo(() => {
    // Generate static mockup representation for May, June, July
    // But calculate July dynamically based on current live data
    const julyRevenue = trips
      .filter(t => t.status === 'Completed' && t.createdAt.includes('-07-'))
      .reduce((sum, t) => sum + (t.revenue || 0), 0);

    const julyExpenses = metrics.totalOpCost;

    return [
      { month: 'May', revenue: 45000, expenses: 22000 },
      { month: 'Jun', revenue: 68000, expenses: 31000 },
      { month: 'Jul', revenue: julyRevenue || 37000, expenses: julyExpenses || 18490 },
    ];
  }, [trips, metrics]);

  // Get max value to scale the chart bars
  const maxChartVal = useMemo(() => {
    const values = chartData.flatMap(d => [d.revenue, d.expenses]);
    return Math.max(...values, 10000);
  }, [chartData]);

  // ── CSV Export Function ──
  const exportToCSV = () => {
    const headers = ['Registration Number', 'Name/Model', 'Type', 'Acquisition Cost (INR)', 'Revenue (INR)', 'Fuel Cost (INR)', 'Maint Cost (INR)', 'Net Profit (INR)', 'ROI (%)'];
    const rows = vehicleROIList.map(v => [
      v.registrationNumber,
      v.name,
      v.type,
      v.acquisitionCost,
      v.revenue,
      v.fuelCost,
      v.maintCost,
      v.netProfit,
      v.roi,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TransitOps_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="analytics-page">
      {/* Header with Export */}
      <div className="analytics-header-row">
        <h2 className="section-title">Operational Reports</h2>
        <button className="btn btn-primary" onClick={exportToCSV}>
          📥 Export CSV Report
        </button>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <span className="analytics-card-label">Fuel Efficiency</span>
          <span className="analytics-card-value">{metrics.fuelEfficiency} km/l</span>
          <span className="analytics-card-sub">Completed trips distance / fuel</span>
        </div>

        <div className="analytics-card">
          <span className="analytics-card-label">Fleet Utilization</span>
          <span className="analytics-card-value">{metrics.fleetUtil}%</span>
          <span className="analytics-card-sub">Active vs available vehicles</span>
        </div>

        <div className="analytics-card">
          <span className="analytics-card-label">Operational Cost</span>
          <span className="analytics-card-value">₹{metrics.totalOpCost.toLocaleString('en-IN')}</span>
          <span className="analytics-card-sub">Fuel (₹{metrics.totalFuelCost.toLocaleString('en-IN')}) + Maint (₹{metrics.totalMaintCost.toLocaleString('en-IN')})</span>
        </div>

        <div className="analytics-card">
          <span className="analytics-card-label">Average Vehicle ROI</span>
          <span className="analytics-card-value">{avgROI}%</span>
          <span className="analytics-card-sub">ROI = (Rev - Expenses) / Acq Cost</span>
        </div>
      </div>

      {/* Main Charts & ROI Breakdown Table */}
      <div className="chart-container">
        {/* CSS/SVG Bar Chart */}
        <div className="revenue-chart-card">
          <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Monthly Revenue vs Operational Costs</h3>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color bar-revenue" />
              <span>Revenue</span>
            </div>
            <div className="legend-item">
              <span className="legend-color bar-expenses" />
              <span>Expenses</span>
            </div>
          </div>

          <div className="bar-chart-visualization">
            {chartData.map((data, idx) => {
              const revHeight = (data.revenue / maxChartVal) * 140;
              const expHeight = (data.expenses / maxChartVal) * 140;

              return (
                <div className="chart-bar-group" key={idx}>
                  <div className="chart-bars">
                    <div 
                      className="chart-bar bar-revenue" 
                      style={{ height: `${revHeight}px` }} 
                      data-value={`₹${data.revenue.toLocaleString('en-IN')}`}
                    />
                    <div 
                      className="chart-bar bar-expenses" 
                      style={{ height: `${expHeight}px` }} 
                      data-value={`₹${data.expenses.toLocaleString('en-IN')}`}
                    />
                  </div>
                  <span className="chart-axis-label">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic ROI breakdown summary */}
        <div className="card">
          <h3 className="section-title">Fleet Productivity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Revenue Generated</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatCurrency(vehicleROIList.reduce((sum, v) => sum + v.revenue, 0))}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Net Profit</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                  {formatCurrency(vehicleROIList.reduce((sum, v) => sum + v.netProfit, 0))}
                </span>
              </div>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
              * High ROI indicates positive vehicle utilization relative to its acquisition and maintenance cost overhead.
            </div>
          </div>
        </div>
      </div>

      {/* ROI Breakdown Table */}
      <div className="roi-table-card">
        <h3 className="section-title">Vehicle ROI Breakdown</h3>
        <div className="maintenance-table-wrapper">
          <table className="maintenance-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Acq. Cost</th>
                <th>Total Revenue</th>
                <th>Fuel Cost</th>
                <th>Maint. Cost</th>
                <th>Net Profit</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {vehicleROIList.map((vehicle) => {
                const isPositive = Number(vehicle.roi) >= 0;
                return (
                  <tr key={vehicle.id}>
                    <td style={{ fontWeight: 700 }}>{vehicle.registrationNumber}</td>
                    <td>{vehicle.type}</td>
                    <td>{formatCurrency(vehicle.acquisitionCost)}</td>
                    <td>{formatCurrency(vehicle.revenue)}</td>
                    <td>{formatCurrency(vehicle.fuelCost)}</td>
                    <td>{formatCurrency(vehicle.maintCost)}</td>
                    <td style={{ fontWeight: 600, color: vehicle.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {formatCurrency(vehicle.netProfit)}
                    </td>
                    <td>
                      <span className={`roi-badge ${isPositive ? 'roi-positive' : 'roi-negative'}`} style={{ fontWeight: 800 }}>
                        {vehicle.roi}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
