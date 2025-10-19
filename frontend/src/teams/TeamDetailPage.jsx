import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teamsAPI } from '../lib/api';
import { Link, useParams } from 'react-router-dom';
import { MembersTab } from './MembersTab';
import { ProjectsTab } from './ProjectsTab';
import { GapTab } from './GapTab';

export const TeamDetailPage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('members');

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const response = await teamsAPI.get(id);
      return response.data;
    }
  });

  if (isLoading) return <div>Loading team...</div>;
  if (!team) return <div>Team not found</div>;

  return (
    <div>
      <nav>
        <Link to="/teams">← Back to Teams</Link>
      </nav>

      <div style={{ marginBottom: '20px' }}>
        <h1>{team.name}</h1>
        {team.description && <p>{team.description}</p>}
        <p>
          <small>Members: {team.members?.length || 0}</small>
        </p>
      </div>

      <div style={{ borderBottom: '2px solid #ccc', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('members')}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            fontWeight: activeTab === 'members' ? 'bold' : 'normal',
            borderBottom: activeTab === 'members' ? '3px solid blue' : 'none'
          }}
        >
          Members
        </button>
        <button 
          onClick={() => setActiveTab('projects')}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            fontWeight: activeTab === 'projects' ? 'bold' : 'normal',
            borderBottom: activeTab === 'projects' ? '3px solid blue' : 'none'
          }}
        >
          Projects
        </button>
        <button 
          onClick={() => setActiveTab('gap')}
          style={{ 
            padding: '10px 20px',
            fontWeight: activeTab === 'gap' ? 'bold' : 'normal',
            borderBottom: activeTab === 'gap' ? '3px solid blue' : 'none'
          }}
        >
          Gap Analysis
        </button>
      </div>

      <div>
        {activeTab === 'members' && <MembersTab teamId={id} team={team} />}
        {activeTab === 'projects' && <ProjectsTab teamId={id} team={team} />}
        {activeTab === 'gap' && <GapTab teamId={id} team={team} />}
      </div>
    </div>
  );
};