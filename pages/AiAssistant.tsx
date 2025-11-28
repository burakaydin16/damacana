import React, { useState } from 'react';
import { askGemini } from '../services/geminiService';
import { Button } from '../components/ui/Button';
import { Sparkles, Send } from 'lucide-react';

export const AiAssistant: React.FC = () => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAsk = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResponse('');
        const answer = await askGemini(query);
        setResponse(answer);
        setLoading(false);
    };

    const suggestions = [
        "En çok borcu olan müşteri kim?",
        "Elimizde kaç adet boş damacana var?",
        "Euro Palet stok durumu nedir?",
        "Son satışlar nasıl?",
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold">Akıllı Asistan</h2>
                </div>
                <p className="text-indigo-100">
                    Stoklarınız, müşterileriniz ve finansal durumunuz hakkında sorular sorun. 
                    Verilerinizi analiz edip size yardımcı olayım.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        className="flex-1 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Örn: Hangi müşteride en çok boş palet var?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    />
                    <Button onClick={handleAsk} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                        {loading ? '...' : <Send size={20} />}
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                        <button 
                            key={i} 
                            onClick={() => setQuery(s)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {response && (
                <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 animate-fade-in">
                    <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Asistan Yanıtı</h3>
                    <div className="prose prose-indigo text-gray-800">
                        {response}
                    </div>
                </div>
            )}
        </div>
    );
};