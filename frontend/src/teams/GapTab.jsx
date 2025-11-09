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

  const handleExportCSV = () => {
    if (!analysisResult) return;

    const project = projects.find(p => p.id === selectedProjectId);
    const projectName = project?.name || 'Gap Analysis';
    
    let csv = 'Gap Analysis Report\n';
    csv += `Project: ${projectName}\n`;
    csv += `Generated: ${new Date(analysisResult.analyzedAt).toLocaleString()}\n`;
    csv += `Overall Risk Score: ${analysisResult.overallRisk.score}\n`;
    csv += `Overall Risk Level: ${analysisResult.overallRisk.level}\n`;
    csv += `Ready to Start: ${analysisResult.overallRisk.readyToStart ? 'Yes' : 'No'}\n`;
    csv += '\n';
    
    csv += 'Summary Statistics\n';
    csv += `Total Skills,${analysisResult.summary.totalSkills}\n`;
    csv += `Skills Ready,${analysisResult.summary.skillsReady}\n`;
    csv += `Skills with Gaps,${analysisResult.summary.skillsWithGaps}\n`;
    csv += `Skills Missing Completely,${analysisResult.summary.skillsMissingCompletely}\n`;
    csv += `Critical Bottlenecks,${analysisResult.summary.criticalBottlenecks}\n`;
    csv += `High Risk Skills,${analysisResult.summary.highRiskSkills}\n`;
    csv += `Medium Risk Skills,${analysisResult.summary.mediumRiskSkills}\n`;
    csv += `Low Risk Skills,${analysisResult.summary.lowRiskSkills}\n`;
    csv += '\n';
    
    csv += 'Detailed Skill Analysis\n';
    csv += 'Skill,Importance,Required Level,Team Average,Gap,Coverage Count,Bus Factor,Risk Score,Risk Level,Bottleneck,Gap Risk,Coverage Risk,Variability Risk,Weighted Gap\n';
    
    Object.entries(analysisResult.skills).forEach(([skill, data]) => {
      csv += `"${skill}",`;
      csv += `${data.importance},`;
      csv += `${data.required},`;
      csv += `${data.average},`;
      csv += `${data.gap},`;
      csv += `${data.coverage.count},`;
      csv += `${data.coverage.busFactor},`;
      csv += `${data.risk.score},`;
      csv += `${data.risk.level},`;
      csv += `${data.risk.bottleneck ? 'Yes' : 'No'},`;
      csv += `${data.risk.factors.gapRisk},`;
      csv += `${data.risk.factors.coverageRisk},`;
      csv += `${data.risk.factors.variabilityRisk},`;
      csv += `${data.weightedGap}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `gap_analysis_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRiskColor = (level) => {
    const colors = {
      critical: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[level] || 'text-gray-600';
  };

  const getRiskBgColor = (level) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRiskBorderColor = (level) => {
    const colors = {
      critical: 'border-red-500',
      high: 'border-orange-500',
      medium: 'border-yellow-500',
      low: 'border-green-500'
    };
    return colors[level] || 'border-gray-500';
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Gap Analysis Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">
          Analyze your team's skill gaps and readiness for projects with enhanced risk scoring
        </p>
      </div>

      {projects?.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600 font-medium">No projects available</p>
          <p className="text-gray-500 text-sm mt-1">Create a project first to run gap analysis</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
            <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Project
            </label>
            <div className="flex gap-3">
              <select
                id="projectSelect"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="input flex-1"
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
                className="btn-primary inline-flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {analysisMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Run Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {selectedProjectId && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Project Requirements</h3>
              <div className="flex flex-wrap gap-3">
                {projects.find(p => p.id === selectedProjectId)?.requirements.map((req, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-blue-300">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-medium text-blue-900">{req.skill}</span>
                    <span className="text-blue-700 text-sm">Level {req.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-6">
              <div className={`bg-white rounded-xl border-4 ${getRiskBorderColor(analysisResult.overallRisk.level)} p-8 shadow-lg`}>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Overall Project Risk</h3>
                  <div className={`text-7xl font-bold ${getRiskColor(analysisResult.overallRisk.level)} mb-3`}>
                    {analysisResult.overallRisk.score}
                  </div>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border ${getRiskBgColor(analysisResult.overallRisk.level)}`}>
                    {analysisResult.overallRisk.level.toUpperCase()}
                  </span>
                  <div className={`mt-6 p-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                    analysisResult.overallRisk.readyToStart 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {analysisResult.overallRisk.readyToStart ? (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Project is ready to start
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Project NOT ready - address gaps first
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Skills" value={analysisResult.summary.totalSkills} color="blue" />
                <StatCard label="Skills Ready" value={analysisResult.summary.skillsReady} color="green" />
                <StatCard label="Skills with Gaps" value={analysisResult.summary.skillsWithGaps} color="orange" />
                <StatCard label="Critical Bottlenecks" value={analysisResult.summary.criticalBottlenecks} color="red" />
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Detailed Skill Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Skill</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Required</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Team Avg</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Gap</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Coverage</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Risk</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bottleneck</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(analysisResult.skills).map(([skill, data]) => (
                        <tr key={skill} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{skill}</div>
                            <div className="text-xs text-gray-500 mt-1">{data.importance}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-900">{data.required}</td>
                          <td className="px-6 py-4">
                            {data.average === 0 ? (
                              <span className="text-red-600 italic text-sm">Not Available</span>
                            ) : (
                              <span className="text-gray-900">{data.average}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${
                              data.gap === 0 ? 'text-green-600' : 
                              data.gap > 1.5 ? 'text-red-600' : 'text-orange-600'
                            }`}>
                              {data.gap}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-900">{data.coverage.count} member(s)</div>
                            <div className="text-xs text-gray-500">Bus Factor: {data.coverage.busFactor}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`text-2xl font-bold ${getRiskColor(data.risk.level)}`}>
                              {data.risk.score}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border mt-1 ${getRiskBgColor(data.risk.level)}`}>
                              {data.risk.level.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {data.risk.bottleneck ? (
                              <span className="flex items-center gap-1 text-red-600 font-bold text-sm">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                YES
                              </span>
                            ) : (
                              <span className="text-gray-500 text-sm">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Factor Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analysisResult.skills).map(([skill, data]) => (
                    <div key={skill} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-4">{skill}</h4>
                      
                      <RiskFactorBar label="Gap Risk" value={data.risk.factors.gapRisk} color="red" />
                      <RiskFactorBar label="Coverage Risk" value={data.risk.factors.coverageRisk} color="orange" />
                      <RiskFactorBar label="Variability Risk" value={data.risk.factors.variabilityRisk} color="yellow" />
                      
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Weighted Gap: </span>
                        <span className="text-sm font-bold text-gray-900">{data.weightedGap}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Report as CSV
                </button>
                <p className="text-sm text-gray-600 mt-2">Download complete gap analysis report</p>
              </div>

              <div className="text-center text-sm text-gray-500">
                Analysis completed at: {new Date(analysisResult.analyzedAt).toLocaleString()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm">
      <div className={`text-4xl font-bold ${colorClasses[color]} mb-2`}>
        {value}
      </div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
    </div>
  );
};

const RiskFactorBar = ({ label, value, color }) => {
  const colorClasses = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500'
  };
  
  const textColorClasses = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600'
  };
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="text-gray-700">{label}</span>
        <span className={`font-bold ${textColorClasses[color]}`}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
};