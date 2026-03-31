import React from 'react';
import { User, FileCode, FileText, Menu } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, onToggle }) => {
  const menuItems = [
    { id: 'patient-360', label: 'Patient 360 View', icon: User },
    { id: 'codes', label: 'ICD-10 & CPT Codes', icon: FileCode },
    { id: 'documents', label: 'Source Documents', icon: FileText },
  ];

  return (
    <>
      {/* Hamburger button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
      )}

      {/* Sidebar */}
      {isOpen && (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo/Brand with Hamburger */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-600">ClinicalAI</h1>
          <p className="text-xs text-gray-500 mt-1">Patient Intelligence Platform</p>
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">© 2025 ClinicalAI</p>
      </div>
    </div>
      )}
    </>
  );
};
