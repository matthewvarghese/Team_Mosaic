import { useAuth } from './auth/AuthContext';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <nav>
        <h1>TeamMosaic</h1>
        <div>
          <span>User: {user?.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </nav>

      <h2>Dashboard</h2>
      <div>
        <Link to="/me/profile">
          <h3>My Profile</h3>
          <p>View and edit your profile</p>
        </Link>

        <Link to="/me/skills">
          <h3>My Skills</h3>
          <p>Manage your technical skills</p>
        </Link>

        <Link to="/teams">
          <h3>Teams</h3>
          <p>View and manage your teams</p>
        </Link>
      </div>
    </div>
  );
};