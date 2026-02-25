import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './contexts/LangContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ImportPage from './pages/ImportPage';
import QuizPage from './pages/QuizPage';

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/import/:setId" element={<ImportPage />} />
            <Route path="/quiz/:setId" element={<QuizPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </LangProvider>
  );
}
