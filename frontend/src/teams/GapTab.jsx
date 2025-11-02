import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { projectsAPI, gapAPI } from '../lib/api';

export const GapTab = ({ teamId, team }) => {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['team-projects', teamId],
    queryFn: async () => {
      const response = await projectsAPI.list(teamId);
      return response.data;
    }
  });

  const analysisMutation = useMutation({
    mutationFn: (data) => gapAPI.analyze(teamId, data),
    onSuccess: (response) => {
      setAnalysisResult(response.data);
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Failed to run analysis');
    }
  });

  const handleRunAnalysis = () => {
    if (!selectedProjectId) {
      alert('Please select a project');
      return;
    }
    setAnalysisResult(null);
    analysisMutation.mutate({ projectId: selectedProjectId });
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getRiskBadgeStyle = (level) => ({
    background: getRiskColor(level),
    color: 'white',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block'
  });

  if (projectsLoading) return <div>Loading projects...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gap Analysis Dashboard</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Analyze your team's skill gaps and readiness for projects with enhanced risk scoring.
      </p>

      {projects.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: '#f9fafb', 
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <p>No projects available. Create a project first to run gap analysis.</p>
        </div>
      ) : (
        <>
          <div style={{ 
            marginBottom: '30px', 
            padding: '20px', 
            background: 'black', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <label htmlFor="projectSelect" style={{ 
              display: 'block', 
              marginBottom: '10px',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              Select Project:
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{ 
                  flex: 1,
                  padding: '10px', 
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              >
                <option value="">-- Choose a project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleRunAnalysis}
                disabled={analysisMutation.isPending || !selectedProjectId}
                style={{ 
                  padding: '10px 24px',
                  background: analysisMutation.isPending || !selectedProjectId ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: analysisMutation.isPending || !selectedProjectId ? 'not-allowed' : 'pointer'
                }}
              >
                {analysisMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
          </div>

          {selectedProjectId && (
            <div style={{ 
              marginBottom: '30px', 
              padding: '20px', 
              background: 'black', 
              border: '1px solid #bfdbfe',
              borderRadius: '8px'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '16px' }}>Project Requirements:</h3>
              {(() => {
                const selectedProject = projects.find(p => p.id === selectedProjectId);
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {selectedProject?.requirements.map((req, idx) => (
                      <div key={idx} style={{
                        background: 'black',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe'
                      }}>
                        <strong>{req.skill}</strong> - Level {req.level}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {analysisResult && (
            <div>
              <div style={{ 
                marginBottom: '30px',
                padding: '30px',
                background: 'white',
                border: `3px solid ${getRiskColor(analysisResult.overallRisk.level)}`,
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Overall Project Risk</h3>
                  <div style={{ 
                    fontSize: '64px', 
                    fontWeight: 'bold',
                    color: getRiskColor(analysisResult.overallRisk.level),
                    lineHeight: 1,
                    marginBottom: '10px'
                  }}>
                    {analysisResult.overallRisk.score}
                  </div>
                  <div style={getRiskBadgeStyle(analysisResult.overallRisk.level)}>
                    {analysisResult.overallRisk.level.toUpperCase()}
                  </div>
                  <div style={{ 
                    marginTop: '20px',
                    padding: '15px',
                    background: analysisResult.overallRisk.readyToStart ? '#d1fae5' : '#fee2e2',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}>
                    {analysisResult.overallRisk.readyToStart ? (
                      <span style={{ color: '#065f46' }}>✓ Project is ready to start</span>
                    ) : (
                      <span style={{ color: '#991b1b' }}>✗ Project NOT ready - address gaps first</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '30px'
              }}>
                <StatCard 
                  label="Total Skills" 
                  value={analysisResult.summary.totalSkills}
                  color="#3b82f6"
                />
                <StatCard 
                  label="Skills Ready" 
                  value={analysisResult.summary.skillsReady}
                  color="#22c55e"
                />
                <StatCard 
                  label="Skills with Gaps" 
                  value={analysisResult.summary.skillsWithGaps}
                  color="#f97316"
                />
                <StatCard 
                  label="Critical Bottlenecks" 
                  value={analysisResult.summary.criticalBottlenecks}
                  color="#ef4444"
                />
              </div>

              <div style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px' }}>Detailed Skill Analysis</h3>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={tableHeaderStyle}>Skill</th>
                        <th style={tableHeaderStyle}>Required</th>
                        <th style={tableHeaderStyle}>Team Avg</th>
                        <th style={tableHeaderStyle}>Gap</th>
                        <th style={tableHeaderStyle}>Coverage</th>
                        <th style={tableHeaderStyle}>Risk Score</th>
                        <th style={tableHeaderStyle}>Risk Level</th>
                        <th style={tableHeaderStyle}>Bottleneck</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analysisResult.skills).map(([skill, data]) => (
                        <tr key={skill} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={tableCellStyle}>
                            <strong>{skill}</strong>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                              {data.importance}
                            </div>
                          </td>
                          <td style={tableCellStyle}>{data.required}</td>
                          <td style={tableCellStyle}>
                            {data.average === 0 ? (
                              <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Not Available</span>
                            ) : (
                              data.average
                            )}
                          </td>
                          <td style={tableCellStyle}>
                            <span style={{ 
                              color: data.gap === 0 ? '#22c55e' : data.gap > 1.5 ? '#ef4444' : '#f97316',
                              fontWeight: 'bold'
                            }}>
                              {data.gap}
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            <div>{data.coverage.count} member(s)</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              Bus Factor: {data.coverage.busFactor}
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <div style={{ 
                              fontSize: '20px', 
                              fontWeight: 'bold',
                              color: getRiskColor(data.risk.level)
                            }}>
                              {data.risk.score}
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <span style={getRiskBadgeStyle(data.risk.level)}>
                              {data.risk.level.toUpperCase()}
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            {data.risk.bottleneck ? (
                              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ YES</span>
                            ) : (
                              <span style={{ color: '#6b7280' }}>No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px' }}>Risk Factor Breakdown</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px'
                }}>
                  {Object.entries(analysisResult.skills).map(([skill, data]) => (
                    <div key={skill} style={{
                      padding: '20px',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <h4 style={{ marginTop: 0, marginBottom: '15px', color: 'black', }}>{skill}</h4>
                      
                      <RiskFactorBar 
                        label="Gap Risk" 
                        value={data.risk.factors.gapRisk} 
                        color="#ef4444"
                      />
                      <RiskFactorBar 
                        label="Coverage Risk" 
                        value={data.risk.factors.coverageRisk} 
                        color="#f97316"
                      />
                      <RiskFactorBar 
                        label="Variability Risk" 
                        value={data.risk.factors.variabilityRisk} 
                        color="#eab308"
                      />
                      
                      <div style={{ 
                        marginTop: '15px',
                        padding: '10px',
                        background: '#f9fafb',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}>
                        <strong>Weighted Gap:</strong> {data.weightedGap}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ 
                marginTop: '30px',
                padding: '15px',
                background: '#f9fafb',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Analysis completed at: {new Date(analysisResult.analyzedAt).toLocaleString()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div style={{
    padding: '20px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  }}>
    <div style={{ fontSize: '32px', fontWeight: 'bold', color, marginBottom: '5px' }}>
      {value}
    </div>
    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
      {label}
    </div>
  </div>
);

const RiskFactorBar = ({ label, value, color }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      marginBottom: '4px',
      fontSize: '13px'
    }}>
      <span style={{ color: '#374151' }}>{label}</span>
      <span style={{ fontWeight: 'bold', color }}>{(value * 100).toFixed(0)}%</span>
    </div>
    <div style={{ 
      width: '100%', 
      height: '8px', 
      background: '#e5e7eb', 
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${value * 100}%`,
        height: '100%',
        background: color,
        transition: 'width 0.3s ease'
      }} />
    </div>
  </div>
);

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: '600',
  color: '#374151'
};

const tableCellStyle = {
  padding: '12px',
  fontSize: '14px',
  color: '#1f2937'
};