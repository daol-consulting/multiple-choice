import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, PlusCircle } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isQuizPage = location.pathname.startsWith('/quiz/');

  const navItems = [
    { to: '/', label: '홈', icon: Home },
    { to: '/import', label: '문제 추가', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-[env(safe-area-inset-bottom)]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl text-primary-600">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            QuizDrill
          </Link>
          <nav className="hidden sm:flex gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-5 sm:py-8">
        {children}
      </main>

      {!isQuizPage && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)]">
          <div className="flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-400'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
