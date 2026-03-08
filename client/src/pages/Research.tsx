import React, { useState, useEffect } from 'react';
import { ExternalLink, Search, BookOpen, RefreshCw, Loader2, ChevronDown, ChevronUp, Newspaper, MessageSquare, ArrowUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { MicButton } from '@/components/ui/mic-button';

const PRESET_QUERIES = [
  'ADHD executive function',
  'ADHD dopamine regulation',
  'ADHD working memory',
  'ADHD medication adults',
  'ADHD time blindness',
  'ADHD sleep',
  'ADHD anxiety comorbidity',
  'ADHD nutrition',
  'ADHD mindfulness',
  'ADHD women diagnosis',
];

interface Paper {
  id: string; title: string; authors: string; year: string;
  journal: string; abstract: string; url: string; citedByCount: number;
}

interface NewsItem {
  id: string; title: string; summary: string; url: string;
  source: string; date: string; score: number; type: 'discussion' | 'link' | 'article';
}

const SOURCE_COLORS: Record<string, string> = {
  'r/ADHD Community': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  'ADDitude Magazine': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'CHADD': 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
};

function PaperCard({ paper }: { paper: Paper }) {
  const [expanded, setExpanded] = useState(false);
  const abstract = paper.abstract || '';
  const shortAbstract = abstract.length > 280 ? abstract.substring(0, 280) + '...' : abstract;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-sm leading-snug flex-1">{paper.title}</h3>
        {paper.url && (
          <a href={paper.url} target="_blank" rel="noopener noreferrer"
            className="shrink-0 p-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors" title="Open free full text">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
      <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
        {paper.year && <span className="bg-secondary px-2 py-0.5 rounded-full font-medium">{paper.year}</span>}
        {paper.journal && <span className="italic">{paper.journal}</span>}
        {paper.citedByCount > 0 && <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{paper.citedByCount} citations</span>}
      </div>
      {paper.authors && <p className="text-xs text-muted-foreground truncate">{paper.authors}</p>}
      {abstract && (
        <div className="text-sm text-muted-foreground leading-relaxed">
          <p>{expanded ? abstract : shortAbstract}</p>
          {abstract.length > 280 && (
            <button onClick={() => setExpanded(!expanded)} className="mt-1 text-xs text-primary hover:underline flex items-center gap-0.5">
              {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const sourceStyle = SOURCE_COLORS[item.source] || 'bg-secondary text-muted-foreground border-border';
  const typeIcon = item.type === 'discussion' ? <MessageSquare className="w-3 h-3" /> : <Newspaper className="w-3 h-3" />;
  const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm leading-snug flex-1 hover:text-primary transition-colors">
          {item.title}
        </a>
        <a href={item.url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 p-1.5 bg-secondary text-muted-foreground rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <div className="flex flex-wrap gap-2 items-center text-xs">
        <span className={`px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${sourceStyle}`}>
          {typeIcon} {item.source}
        </span>
        {dateStr && <span className="text-muted-foreground">{dateStr}</span>}
        {item.score > 0 && (
          <span className="flex items-center gap-0.5 text-orange-500">
            <ArrowUp className="w-3 h-3" /> {item.score.toLocaleString()}
          </span>
        )}
      </div>
      {item.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.summary}</p>
      )}
    </div>
  );
}

export default function Research() {
  const [tab, setTab] = useState<'papers' | 'news'>('papers');
  const [query, setQuery] = useState('ADHD executive function');
  const [sort, setSort] = useState<'date' | 'citations'>('date');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const speech = useSpeechToText({ continuous: false, onTranscript: (t) => setQuery(t.trim()) });

  const fetchPapers = async (q = query, s = sort) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/research?query=${encodeURIComponent(q)}&sort=${s}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPapers(data.papers || []);
      setTotal(data.total || 0);
    } catch { setError('Failed to load research. Check your connection and try again.'); }
    finally { setLoading(false); }
  };

  const fetchNews = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNewsItems(data.items || []);
    } catch { setError('Failed to load news. Check your connection and try again.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPapers(); }, []);

  const handleTabChange = (newTab: 'papers' | 'news') => {
    setTab(newTab);
    if (newTab === 'news' && newsItems.length === 0) fetchNews();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Research & News</h1>
        <p className="text-muted-foreground">Open-access science, ADHD news, and community discussions — all in one place.</p>
      </header>

      <div className="flex bg-secondary rounded-xl p-1 gap-1">
        <button
          onClick={() => handleTabChange('papers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'papers' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <BookOpen className="w-4 h-4" /> Research Papers
        </button>
        <button
          onClick={() => handleTabChange('news')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'news' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Newspaper className="w-4 h-4" /> News & Community
        </button>
      </div>

      {tab === 'papers' && (
        <>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <form onSubmit={e => { e.preventDefault(); fetchPapers(); }} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={speech.isListening ? (speech.interimTranscript || query) : query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search ADHD research..."
                  className="pl-9 bg-background"
                />
              </div>
              <MicButton isListening={speech.isListening} isSupported={speech.isSupported} onToggle={speech.toggleListening} />
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2">
                <Search className="w-4 h-4" /> Search
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {PRESET_QUERIES.map(q => (
                <button key={q} onClick={() => { setQuery(q); fetchPapers(q); }}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${query === q ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Sort:</span>
                {[{ id: 'date', label: 'Newest' }, { id: 'citations', label: 'Most Cited' }].map(s => (
                  <button key={s.id} onClick={() => { setSort(s.id as any); fetchPapers(query, s.id as any); }}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${sort === s.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <button onClick={() => fetchPapers()} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Sources:</strong> Europe PubMed Central · PubMed · NIH open-access repositories. All papers are free to read.
              Also check <a href="https://scholar.google.com" target="_blank" rel="noopener" className="underline">Google Scholar</a> and <a href="https://www.semanticscholar.org" target="_blank" rel="noopener" className="underline">Semantic Scholar</a>.
            </div>
          </div>

          {loading && <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Searching open-access literature...</span></div>}
          {error && <div className="text-center py-12 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">{error}</div>}
          {!loading && papers.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">{total.toLocaleString()} open-access results — showing {papers.length}</p>
              <div className="space-y-4">{papers.map(p => <PaperCard key={p.id} paper={p} />)}</div>
            </div>
          )}
          {!loading && papers.length === 0 && !error && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              No open-access papers found for this query. Try different keywords.
            </div>
          )}
        </>
      )}

      {tab === 'news' && (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground space-x-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs"><MessageSquare className="w-3 h-3" /> r/ADHD Community</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs"><Newspaper className="w-3 h-3" /> ADDitude Magazine</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-xs"><Newspaper className="w-3 h-3" /> CHADD</span>
            </div>
            <button onClick={fetchNews} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading && <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading ADHD news...</span></div>}
          {error && <div className="text-center py-12 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">{error}</div>}
          {!loading && newsItems.length > 0 && (
            <div className="space-y-4">
              {newsItems.map(item => <NewsCard key={item.id} item={item} />)}
            </div>
          )}
          {!loading && newsItems.length === 0 && !error && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No news loaded yet. Click the refresh button above.</p>
              <button onClick={fetchNews} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Load News</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
