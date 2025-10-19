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

  const getStatusColor = (gap) => {
    if (gap === 0) return '#22c55e';
    if (gap <= 1) return '#eab308'; 
    return '#ef4444'; 
  };

  const getStatusText = (gap) => {
    if (gap === 0) return 'Ready';
    if (gap <= 1) return 'Minor Gap';
    return 'Needs Training';
  };

  if (projectsLoading) return <div>Loading projects...</div>;

  return (
    <div>
      <h2>Gap Analysis</h2>
      <p>Analyze your team's skill gaps against project requirements.</p>

      {projects.length === 0 ? (
        <div>
          <p>No projects available. Create a project first to run gap analysis.</p>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="projectSelect">Select Project:</label>
            <select
              id="projectSelect"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px', minWidth: '200px' }}
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
              style={{ marginLeft: '10px', padding: '5px 15px' }}
            >
              {analysisMutation.isPending ? 'Running Analysis...' : 'Run Analysis'}
            </button>
          </div>

          {selectedProjectId && (
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e5e7eb' }}>
              <h3>Selected Project Requirements:</h3>
              {(() => {
                const selectedProject = projects.find(p => p.id === selectedProjectId);
                return (
                  <ul>
                    {selectedProject?.requirements.map((req, idx) => (
                      <li key={idx}>
                        <strong>{req.skill}</strong> - Level {req.level}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          )}

          {analysisResult && (
            <div style={{ marginTop: '30px' }}>
              <h3>Analysis Results</h3>
              
              <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Skill</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Required Level</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Team Average</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Gap</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysisResult).map(([skill, data]) => (
                    <tr key={skill}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{skill}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{data.required}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {data.average === 0 ? (
                          <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Not Available</span>
                        ) : (
                          data.average
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                        {data.gap}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: getStatusColor(data.gap),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {getStatusText(data.gap)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #e5e7eb' }}>
                <h4>Summary</h4>
                <ul>
                  <li>
                    <strong>Total Requirements:</strong> {Object.keys(analysisResult).length}
                  </li>
                  <li>
                    <strong>Ready Skills:</strong>{' '}
                    {Object.values(analysisResult).filter(d => d.gap === 0).length}
                  </li>
                  <li>
                    <strong>Skills with Gaps:</strong>{' '}
                    {Object.values(analysisResult).filter(d => d.gap > 0).length}
                  </li>
                  <li>
                    <strong>Missing Skills:</strong>{' '}
                    {Object.values(analysisResult).filter(d => d.average === 0).length}
                  </li>
                  <li>
                    <strong>Team Ready:</strong>{' '}
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: Object.values(analysisResult).every(d => d.gap === 0) ? '#22c55e' : '#ef4444' 
                    }}>
                      {Object.values(analysisResult).every(d => d.gap === 0) ? 'YES ✓' : 'NO ✗'}
                    </span>
                  </li>
                </ul>
              </div>

              <div style={{ marginTop: '30px' }}>
                <h4>Visual Gap Overview</h4>
                {Object.entries(analysisResult).map(([skill, data]) => (
                  <div key={skill} style={{ marginBottom: '15px' }}>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>{skill}</strong>
                      <span style={{ marginLeft: '10px', fontSize: '14px', color: '#6b7280' }}>
                        {data.average}/{data.required} (Gap: {data.gap})
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '30px', 
                      background: '#e5e7eb', 
                      borderRadius: '4px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          width: `${(data.average / 5) * 100}%`,
                          height: '100%',
                          background: data.gap === 0 ? '#22c55e' : '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '10px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        Team: {data.average}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          left: `${(data.required / 5) * 100}%`,
                          top: 0,
                          bottom: 0,
                          width: '2px',
                          background: '#ef4444',
                          zIndex: 10
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: `${(data.required / 5) * 100}%`,
                          top: '-20px',
                          fontSize: '12px',
                          color: '#ef4444',
                          fontWeight: 'bold',
                          transform: 'translateX(-50%)'
                        }}
                      >
                        Required: {data.required}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};