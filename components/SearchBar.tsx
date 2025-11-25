import React, { useState } from 'react';
import { Search, Loader2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { SAMPLE_QUERIES } from '../constants';
import { SearchFilters } from '../types';

interface SearchBarProps {
  onSearch: (keyword: string, filters: SearchFilters) => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading }) => {
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minFollowers, setMinFollowers] = useState('');
  const [maxFollowers, setMaxFollowers] = useState('');
  const [bioKeyword, setBioKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword, { minFollowers, maxFollowers, bioKeyword });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-32 py-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-lg shadow-black/20 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all text-base"
            placeholder="Ex: Tatuador em São Paulo, Advogado..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !keyword.trim()}
            className="absolute right-2 top-2 bottom-2 bg-brand-600 hover:bg-brand-500 text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-transparent"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              'Buscar'
            )}
          </button>
        </div>
      </form>

      {/* Filters Toggle & Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-4 py-2 flex items-center justify-between text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-sm font-medium transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filtros Avançados</span>
            {(minFollowers || maxFollowers || bioKeyword) && (
              <span className="bg-brand-900/50 text-brand-300 border border-brand-800 px-2 py-0.5 rounded-full text-xs">
                Ativo
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFilters && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/50 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Mínimo de Seguidores</label>
              <input 
                type="number" 
                placeholder="Ex: 1000"
                value={minFollowers}
                onChange={(e) => setMinFollowers(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Máximo de Seguidores</label>
              <input 
                type="number" 
                placeholder="Ex: 10000"
                value={maxFollowers}
                onChange={(e) => setMaxFollowers(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Palavra-chave na Bio</label>
              <input 
                type="text" 
                placeholder="Ex: Especialista, Premiado, Atendimento 24h, Presencial..."
                value={bioKeyword}
                onChange={(e) => setBioKeyword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500 pt-2">
        <span>Sugestões:</span>
        {SAMPLE_QUERIES.slice(0, 3).map((query) => (
          <button
            key={query}
            onClick={() => {
              setKeyword(query);
              onSearch(query, { minFollowers, maxFollowers, bioKeyword });
            }}
            disabled={loading}
            className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full hover:border-brand-500/50 hover:text-brand-400 transition-colors disabled:opacity-50 text-slate-400"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;