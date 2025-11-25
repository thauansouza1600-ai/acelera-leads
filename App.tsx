import React, { useState, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import ProfileCard from './components/ProfileCard';
import { InstagramProfile, SearchState, SearchFilters } from './types';
import { searchProfiles } from './services/geminiService';
import { Sparkles, AlertCircle, Instagram } from 'lucide-react';

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<InstagramProfile[]>([]);
  const [searchState, setSearchState] = useState<SearchState>({
    loading: false,
    error: null,
    hasSearched: false
  });
  const [currentKeyword, setCurrentKeyword] = useState<string>("");

  const handleSearch = useCallback(async (keyword: string, filters: SearchFilters) => {
    setSearchState({ loading: true, error: null, hasSearched: true });
    setCurrentKeyword(keyword);
    setProfiles([]); 

    try {
      const results = await searchProfiles(keyword, filters);
      setProfiles(results);
      setSearchState({ loading: false, error: null, hasSearched: true });
    } catch (error: any) {
      console.error(error);
      let errorMsg = "Não conseguimos encontrar perfis no momento.";
      
      // User friendly error mapping
      if (error.message.includes('429') || error.message.includes('Muitas requisições')) {
        errorMsg = "Alto tráfego na IA. Aguarde alguns segundos e tente novamente.";
      } else if (error.message.includes('Nenhum perfil')) {
        errorMsg = error.message;
      }

      setSearchState({
        loading: false,
        error: errorMsg,
        hasSearched: true
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-1.5 rounded-lg text-white shadow-lg shadow-purple-900/20">
              <Instagram className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Acelera Leads
            </h1>
          </div>
          <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
            Powered by Gemini
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2 shadow-sm">
            <Sparkles className="w-3 h-3" />
            Pesquisa Inteligente v2.0
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Encontre o profissional ideal <br/> no <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Instagram</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Digite uma profissão ou palavra-chave e nossa IA buscará perfis reais, analisando bios e extraindo contatos automaticamente.
          </p>
          
          <div className="pt-6">
            <SearchBar onSearch={handleSearch} loading={searchState.loading} />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-8">
          
          {/* Results Header */}
          {searchState.hasSearched && !searchState.loading && !searchState.error && profiles.length > 0 && (
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-lg pb-4 border-b border-slate-800 animate-in fade-in slide-in-from-bottom-2">
              <span className="bg-brand-900 text-brand-200 px-2.5 py-0.5 rounded-md text-sm border border-brand-800">
                {profiles.length}
              </span>
              Resultados encontrados para "{currentKeyword}"
            </div>
          )}

          {/* Skeletons */}
          {searchState.loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-900 rounded-xl h-72 p-6 shadow-sm border border-slate-800 animate-pulse flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-800 rounded w-full"></div>
                    <div className="h-3 bg-slate-800 rounded w-full"></div>
                    <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-10 bg-slate-800 rounded w-1/2"></div>
                    <div className="h-10 bg-slate-800 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {searchState.error && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-8 text-center text-red-200 flex flex-col items-center gap-3 max-w-lg mx-auto animate-in zoom-in-95">
              <div className="p-3 bg-red-900/20 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-bold text-lg">Ops, algo deu errado</h3>
              <p className="text-slate-400">{searchState.error}</p>
            </div>
          )}

          {/* Empty State */}
          {!searchState.loading && searchState.hasSearched && !searchState.error && profiles.length === 0 && (
            <div className="text-center text-slate-500 py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
              <p className="text-lg font-medium text-slate-400">Nenhum perfil encontrado</p>
              <p className="text-sm">Tente palavras-chave mais específicas ou reduza os filtros.</p>
            </div>
          )}

          {/* Cards Grid */}
          {!searchState.loading && profiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile, index) => (
                <div key={`${profile.username}-${index}`} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                  <ProfileCard profile={profile} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;