import React, { useState, useEffect } from 'react';
import { RefreshCw, Calculator, DollarSign, ArrowRightLeft } from 'lucide-react';

interface ExchangeRates {
  rates: Record<string, number>;
  time_last_update_utc: string;
}

export default function CurrencyConverter({ initialUSD = 0 }: { initialUSD?: number }) {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [amount, setAmount] = useState<number>(initialUSD);
  const [targetCurrency, setTargetCurrency] = useState<string>('HTG');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commonCurrencies = [
    { code: 'HTG', name: 'Gourde Haïtienne' },
    { code: 'EUR', name: 'Euro' },
    { code: 'CAD', name: 'Dollar Canadien' },
    { code: 'DOP', name: 'Peso Dominicain' },
    { code: 'BRL', name: 'Réal Brésilien' },
  ];

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error('Échec de la récupération des taux');
      const data: ExchangeRates = await response.json();
      setRates(data.rates);
      setLastUpdate(data.time_last_update_utc);
    } catch (err) {
      setError('Impossible de charger les taux de change.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const convertedAmount = rates[targetCurrency] ? amount * rates[targetCurrency] : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-wider">
          <Calculator className="w-4 h-4 mr-2 text-blue-600" />
          Convertisseur de Devises
        </h3>
        <button 
          onClick={fetchRates}
          disabled={isLoading}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 group"
          title="Actualiser les taux"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Montant (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <DollarSign className="w-3 h-3" />
              </span>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vers</label>
            <select 
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
            >
              {commonCurrencies.map(curr => (
                <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
              ))}
              {Object.keys(rates).filter(c => !commonCurrencies.find(cc => cc.code === c)).sort().map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : (
          <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between border border-blue-100/50">
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Résultat estimé</p>
              <p className="text-lg font-black text-blue-900 font-heading">
                {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {targetCurrency}
              </p>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-blue-300" />
          </div>
        )}

        {lastUpdate && (
          <p className="text-[9px] text-gray-400 text-right">
            Dernière mise à jour : {new Date(lastUpdate).toLocaleString('fr-FR')}
          </p>
        )}
      </div>
    </div>
  );
}
