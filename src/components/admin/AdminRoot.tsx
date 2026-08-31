import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { User } from '../../types/admin';
import { Story } from '../../types/story';
import { AdminLogin } from './AdminLogin';
import { AdminLayout, AdminTab } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminStoriesList } from './AdminStoriesList';
import { AdminStoryForm } from './AdminStoryForm';
import { AdminCategories } from './AdminCategories';
import { AdminAdsManager } from './AdminAdsManager';
import { AdminSettings } from './AdminSettings';
import { adminService } from '../../services/adminService';

interface AdminRootProps {
  onBackToPublic: () => void;
  onViewStoryPublic: (slug: string) => void;
}

export const AdminRoot: React.FC<AdminRootProps> = ({
  onBackToPublic,
  onViewStoryPublic,
}) => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [storyToEdit, setStoryToEdit] = useState<Story | null>(null);

  // Subscribe to authentication changes & verify session on mount
  useEffect(() => {
    const unsubscribe = authService.subscribe((u) => {
      setUser(u);
    });

    authService
      .verifySession()
      .then((u) => {
        setUser(u);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });

    return unsubscribe;
  }, []);

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  const handleEditStory = async (storyId: string) => {
    try {
      const stories = await adminService.getStories();
      const found = stories.find((s) => s.id === storyId);
      if (found) {
        setStoryToEdit(found);
        setActiveTab('new-story'); // Uses the editor form
      }
    } catch {
      // ignore
    }
  };

  const handleStorySaved = (_savedStory: Story) => {
    setStoryToEdit(null);
    setActiveTab('stories');
  };

  const handleCancelForm = () => {
    setStoryToEdit(null);
    setActiveTab('stories');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Verifying secure admin session...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, render the dedicated Login View
  if (!user) {
    return (
      <AdminLogin
        onSuccess={handleLoginSuccess}
        onBackToSite={onBackToPublic}
      />
    );
  }

  // Render Protected Admin Workspace
  return (
    <AdminLayout
      user={user}
      activeTab={activeTab}
      onTabChange={(tab) => {
        if (tab !== 'new-story') {
          setStoryToEdit(null);
        }
        setActiveTab(tab);
      }}
      onLogout={handleLogout}
      onViewPublicSite={onBackToPublic}
    >
      {activeTab === 'dashboard' && (
        <AdminDashboard
          onNavigate={(tab) => {
            if (tab === 'new-story') setStoryToEdit(null);
            setActiveTab(tab);
          }}
          onEditStory={handleEditStory}
          onViewPublicStory={onViewStoryPublic}
        />
      )}

      {activeTab === 'stories' && (
        <AdminStoriesList
          onNewStory={() => {
            setStoryToEdit(null);
            setActiveTab('new-story');
          }}
          onEditStory={handleEditStory}
          onViewPublicStory={onViewStoryPublic}
        />
      )}

      {activeTab === 'new-story' && (
        <AdminStoryForm
          storyToEdit={storyToEdit}
          onSaved={handleStorySaved}
          onCancel={handleCancelForm}
          onViewPublic={onViewStoryPublic}
        />
      )}

      {activeTab === 'categories' && <AdminCategories />}

      {activeTab === 'ads' && <AdminAdsManager />}

      {activeTab === 'settings' && <AdminSettings />}
    </AdminLayout>
  );
};
