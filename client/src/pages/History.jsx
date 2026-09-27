import React, { useState, useEffect } from 'react';
import { fetchLogs } from '../services/automationService';
import HandwrittenHeading from '../components/HandwrittenHeading';
import { Activity, CheckCircle, Clock, Zap, Cpu, BarChart2, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import '../styles/global.css';

const History = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const totalExecutions = logs.length;
  const successfulExecutions = logs.filter(item => String(item.status || '').toLowerCase() === 'success').length;
  const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
  const validResponseTimes = logs
    .map(item => Number(item.responseTimeMs || 0))
    .filter(value => Number.isFinite(value) && value >= 0);
  const averageResponseTime = validResponseTimes.length > 0 ? validResponseTimes.reduce((sum, value) => sum + value, 0) / validResponseTimes.length : 0;
  const totalTokenUsage = logs.reduce((sum, item) => sum + (Number(item.aiTokenUsage || 0) || 0), 0);

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const chartData = last7Days.map(day => {
    const dayKey = day.toISOString().slice(0, 10);
    const count = logs.filter(item => {
      const itemDate = new Date(item.executedAt || item.createdAt || item.completedAt || Date.now());
      return itemDate.toISOString().slice(0, 10) === dayKey;
    }).length;

    return {
      day,
      label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count
    };
  });

  const maxChartValue = Math.max(...chartData.map(item => item.count), 1);

  const channelCounts = logs.reduce((acc, item) => {
    const channel = String(item.channel || 'unknown');
    acc[channel] = (acc[channel] || 0) + 1;
    return acc;
  }, {});

  const pipelineEntries = Object.entries(channelCounts).map(([name, count]) => ({
    name,
    count,
    percent: totalExecutions > 0 ? (count / totalExecutions) * 100 : 0
  }));

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchLogs();
      if (res.success) setLogs(res.data || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="page-container" style={{ perspective: 'none' }}>
      {/* Page Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <HandwrittenHeading text="Analytics & Execution History" size="normal" withFlourish={true} />
          <p className="page-subtitle">Real-time performance metrics and frozen execution trace logs.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadLogs}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Floating Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem', perspective: 'none' }}>
        <div className="glass-card floating-1" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL EXECUTION RUNS</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginTop: '0.2rem' }}>
                {totalExecutions}
              </div>
            </div>
            <div style={{ background: 'var(--primary-light)', padding: '0.6rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-dark)' }}>
              <Zap size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--primary-dark)', marginTop: '0.5rem', fontWeight: 700 }}>
            {totalExecutions === 0 ? 'No executions recorded yet' : `${successfulExecutions} successful executions`}
          </div>
        </div>

        <div className="glass-card floating-2" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SUCCESS RATE</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--primary-dark)', marginTop: '0.2rem' }}>
                {totalExecutions > 0 ? `${successRate.toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div style={{ background: 'var(--primary-light)', padding: '0.6rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <CheckCircle size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--primary-dark)', marginTop: '0.5rem', fontWeight: 700 }}>
            {totalExecutions === 0 ? 'Awaiting first execution' : `${successfulExecutions} of ${totalExecutions} completed successfully`}
          </div>
        </div>

        <div className="glass-card floating-3" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AVG RESPONSE TIME</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginTop: '0.2rem' }}>
                {averageResponseTime > 0 ? `${Math.round(averageResponseTime)}ms` : '0ms'}
              </div>
            </div>
            <div style={{ background: 'var(--primary-light)', padding: '0.6rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-dark)' }}>
              <Clock size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>
            {totalExecutions === 0 ? 'No execution latency available' : 'Based on real execution durations'}
          </div>
        </div>

        <div className="glass-card floating-1" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI TOKEN USAGE</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginTop: '0.2rem' }}>
                {totalTokenUsage}
              </div>
            </div>
            <div style={{ background: 'var(--primary-light)', padding: '0.6rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <Cpu size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--primary-dark)', marginTop: '0.5rem', fontWeight: 700 }}>
            {totalTokenUsage === 0 ? 'No AI usage captured yet' : 'Actual Groq usage'}
          </div>
        </div>
      </div>

      {/* Floating Data Charts Section (2D Line & Bar Charts) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem', perspective: 'none' }}>
        {/* Main Line Graph with Rama Green Gradient */}
        <div className="glass-card floating-2" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid var(--border-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>EXECUTION VOLUME OVER TIME</span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginTop: '0.1rem' }}>Daily Automation Throughput</h3>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Last 7 Days</span>
          </div>

          <div style={{ width: '100%', height: '220px', position: 'relative' }}>
            {chartData.some(item => item.count > 0) ? (
              <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ramaGreenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C896" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#00C896" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="40" x2="500" y2="40" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />

                <path
                  d={chartData.map((point, index) => {
                    const x = (index / (chartData.length - 1)) * 500;
                    const y = 180 - (point.count / maxChartValue) * 120;
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ') + ' L 500 200 L 0 200 Z'}
                  fill="url(#ramaGreenGrad)"
                />

                <path
                  d={chartData.map((point, index) => {
                    const x = (index / (chartData.length - 1)) * 500;
                    const y = 180 - (point.count / maxChartValue) * 120;
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#00C896"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 500;
                  const y = 180 - (point.count / maxChartValue) * 120;
                  return <circle key={index} cx={x} cy={y} r={point.count > 0 ? 5 : 0} fill="#059669" stroke="#FFFFFF" strokeWidth="2" />;
                })}
              </svg>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                No execution data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Distribution Bar Chart */}
        <div className="glass-card floating-3" style={{ padding: '1.75rem', background: '#FFFFFF' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>PIPELINE DISTRIBUTION</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginTop: '0.1rem' }}>n8n vs Groq Workloads</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            {pipelineEntries.length > 0 ? (
              pipelineEntries.map((entry, index) => (
                <div key={entry.name || index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span>{entry.name.toUpperCase()} {entry.name === 'gmail' ? 'Automation Node' : entry.name === 'telegram' ? 'Bot Node' : 'Workflow'}</span>
                    <span style={{ color: 'var(--primary-dark)' }}>{entry.percent.toFixed(0)}%</span>
                  </div>
                  <div style={{ background: '#E2E8F0', height: '10px', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        background: index % 3 === 0 ? 'var(--primary)' : index % 3 === 1 ? '#059669' : '#0B5D34',
                        width: `${entry.percent}%`,
                        height: '100%'
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                No pipeline execution data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Suspended Table Panel */}
      <div className="glass-card floating-1" style={{ padding: '1.75rem', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
            Execution Logs & Trace History
          </h3>
          <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
            STATUS: REAL-TIME VERIFIED
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                <th style={{ padding: '0.75rem 1rem' }}>Channel</th>
                <th style={{ padding: '0.75rem 1rem' }}>Latency</th>
                <th style={{ padding: '0.75rem 1rem' }}>Message Trace</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const statusText = String(log.status || 'UNKNOWN').toUpperCase();
                const statusBadgeClass = statusText === 'SUCCESS' ? 'status-success' : statusText === 'SCHEDULED' ? 'status-scheduled' : statusText === 'FAILED' ? 'status-failed' : 'status-processing';

                return (
                  <tr key={log._id || log.automationId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`status-badge ${statusBadgeClass}`}>
                        <CheckCircle size={12} /> {statusText}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.executedAt || log.createdAt || log.completedAt || Date.now()).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{log.intent || log.action || 'Automation Trigger'}</td>
                    <td style={{ padding: '0.85rem 1rem', textTransform: 'uppercase', fontWeight: 700 }}>{String(log.channel || 'N/A').toUpperCase()}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                      {Number(log.responseTimeMs || 0) > 0 ? `${Math.round(Number(log.responseTimeMs))}ms` : '0ms'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {log.error || log.originalCommand || log.generatedContent?.body || 'No execution trace available.'}
                    </td>
                  </tr>
                );
              })}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No execution records found. Execute a command to see live analytics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
