import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { AuthGate } from './auth/AuthGate';
import { LoginPage } from './auth/LoginPage';
import { DashboardPage } from './DashboardPage';
import { ProfilePage } from './profile/ProfilePage';
import { SkillsPage } from './skills/SkillsPage';
import { TeamsListPage } from './teams/TeamsListPage';
import { TeamDetailPage } from './teams/TeamDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <AuthGate>
                  <DashboardPage />
                </AuthGate>
              }
            />
            <Route
              path="/me/profile"
              element={
                <AuthGate>
                  <ProfilePage />
                </AuthGate>
              }
            />
            <Route
              path="/me/skills"
              element={
                <AuthGate>
                  <SkillsPage />
                </AuthGate>
              }
            />
            <Route
              path="/teams"
              element={
                <AuthGate>
                  <TeamsListPage />
                </AuthGate>
              }
            />
            <Route
              path="/teams/:id"
              element={
                <AuthGate>
                  <TeamDetailPage />
                </AuthGate>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;