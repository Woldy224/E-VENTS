import React from 'react';
import { Calendar, User, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  currentView: string;
  onViewChange: (view: string) => void;
  onToggleAdmin: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
}

export default function Header({
  isAdmin,
  currentView,
  onViewChange,
  onToggleAdmin,
  mobileMenuOpen,
  onToggleMobileMenu,
  onLogout,
  isAuthenticated
}: HeaderProps) {
  const menuItems = [
    ...(isAuthenticated ? [
      { id: 'events', label: 'Événements', icon: Calendar },
      { id: 'dashboard', label: 'Mon Espace', icon: LayoutDashboard },
      { id: 'propose', label: 'Proposer un Événement', icon: User }
    ] : []),
    ...(isAdmin ? [
      { id: 'admin-events', label: 'Gérer les Événements', icon: Calendar },
      { id: 'admin-proposals', label: 'Propositions', icon: User },
    ] : [])
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img
              src="/assets/logo.png"
              alt="E-VENTS Logo"
              className="h-10 object-contain drop-shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar h-8 w-8 text-blue-600"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg><h1 class="ml-2 text-xl font-bold text-gray-900">E-VENTS</h1></div>';
              }}
            />
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentView === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">

            {/* Bouton Admin (affiche seulement si personne n'est connecté ET qu'on n'est pas déjà en mode admin) */}
            {!isAuthenticated && !isAdmin && (
              <button
                onClick={onToggleAdmin}
                className="hidden md:block px-4 py-2 text-sm font-medium rounded-md transition-colors  text-white"
              >
                EA
              </button>
            )}
            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="hidden md:flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors bg-red-600 text-white hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </button>
            ) : (
              <>
                <button
                  onClick={() => onViewChange('login')}
                  className="hidden md:block px-4 py-2 text-sm font-medium rounded-md transition-colors bg-green-600 text-white hover:bg-green-700"
                >
                  Inscription / Connexion
                </button>
              </>
            )}

            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      onToggleMobileMenu();
                    }}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentView === item.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}

              {/* Actions Auth sur mobile */}
              {!isAuthenticated ? (
                <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
                  <button
                    onClick={() => {
                      onViewChange('login');
                      onToggleMobileMenu();
                    }}
                    className="w-full px-3 py-2 text-sm font-medium rounded-md transition-colors bg-green-600 text-white hover:bg-green-700"
                  >
                    Inscription / Connexion
                  </button>

                  {!isAdmin && (
                    <button
                      onClick={() => {
                        onToggleAdmin();
                        onToggleMobileMenu();
                      }}
                      className="w-full px-3 py-2 text-sm font-medium rounded-md transition-colors bg-blue-600 text-white hover:bg-white-700"
                    >
                      Admin
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (onLogout) onLogout();
                      onToggleMobileMenu();
                    }}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors bg-red-600 text-white hover:bg-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
