import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { GeneratorView } from './components/views/GeneratorView';
import { QuestionEditorView } from './components/views/QuestionEditorView';
import { BlueprintsView } from './components/views/BlueprintsView';
import { QuestionCardsView } from './components/views/QuestionCardsView';
import { RubricsView } from './components/views/RubricsView';
import { ExamPaperView } from './components/views/ExamPaperView';
import { QuestionBankView } from './components/views/QuestionBankView';
import { CbtExamView } from './components/views/CbtExamView';
import { GradingView } from './components/views/GradingView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { GradebookView } from './components/views/GradebookView';
import { RemedialView } from './components/views/RemedialView';
import { MasterDataView } from './components/views/MasterDataView';
import { CurriculumView } from './components/views/CurriculumView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { DeploymentGuideView } from './components/views/DeploymentGuideView';
import { AssessmentsView } from './components/views/AssessmentsView';
import { QuestionValidationView } from './components/views/QuestionValidationView';
import { madrasahStore } from './lib/storage';
import { UserProfile } from './types';
import { Menu, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(madrasahStore.getCurrentUser());
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Subscribe to store changes (reactive state)
  useEffect(() => {
    const unsubscribe = madrasahStore.subscribe(() => {
      setCurrentUser({ ...madrasahStore.getCurrentUser() });
    });
    return unsubscribe;
  }, []);

  const handleNavigate = (view: string) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'assessments':
        return <AssessmentsView onNavigate={handleNavigate} />;
      case 'generator':
        return <GeneratorView onNavigate={handleNavigate} />;
      case 'validation':
        return <QuestionValidationView onNavigate={handleNavigate} />;
      case 'editor':
        return <QuestionEditorView onNavigate={handleNavigate} />;
      case 'question_bank':
        return <QuestionBankView onNavigate={handleNavigate} />;
      case 'blueprints':
        return <BlueprintsView onNavigate={handleNavigate} />;
      case 'question_cards':
        return <QuestionCardsView onNavigate={handleNavigate} />;
      case 'rubrics':
        return <RubricsView onNavigate={handleNavigate} />;
      case 'exam_paper':
        return <ExamPaperView onNavigate={handleNavigate} />;
      case 'cbt':
        return <CbtExamView onNavigate={handleNavigate} />;
      case 'grading':
        return <GradingView onNavigate={handleNavigate} />;
      case 'analytics':
        return <AnalyticsView onNavigate={handleNavigate} />;
      case 'gradebook':
        return <GradebookView onNavigate={handleNavigate} />;
      case 'remedial':
        return <RemedialView onNavigate={handleNavigate} />;
      case 'master_data':
        return <MasterDataView />;
      case 'curriculum':
        return <CurriculumView />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'deployment':
        return <DeploymentGuideView />;
      default:
        return <DashboardView currentUser={currentUser} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased text-gray-900">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            activeView={activeView}
            onNavigate={handleNavigate}
            userRole={currentUser.role}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <div className="relative z-50 flex flex-col max-w-xs w-full bg-[#064e3b]">
              <div className="p-4 flex items-center justify-between border-b border-emerald-800">
                <span className="font-extrabold text-white text-sm">MENU NAVIGASI</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-md text-emerald-200 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  activeView={activeView}
                  onNavigate={handleNavigate}
                  userRole={currentUser.role}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center space-x-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
            >
              <Menu className="w-4 h-4 text-emerald-800" />
              <span>Buka Menu Modul</span>
            </button>
            <span className="text-xs font-semibold text-emerald-800 capitalize">
              {activeView.replace('_', ' ')}
            </span>
          </div>

          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
