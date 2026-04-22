import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, Bell, FileText, LogOut, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const navItems = [
  { path: '/mi-estado', icon: Home, label: 'Mi Estado' },
  { path: '/mis-pagos', icon: CreditCard, label: 'Mis Pagos' },
  { path: '/mis-avisos', icon: Bell, label: 'Avisos' },
  { path: '/mi-contrato', icon: FileText, label: 'Contrato' },
];

export default function TenantLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">La Vecindad</span>
        </div>
        <button 
          onClick={() => base44.auth.logout()} 
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="flex max-w-lg mx-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}