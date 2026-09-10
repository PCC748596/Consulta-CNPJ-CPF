import React, { useState } from 'react';

// --- Funções Utilitárias e de Formatação ---
const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
    .substring(0, 14);
};

const formatCEP = (value: any) => {
  if (!value) return '';
  return value.toString().replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
};

const formatCurrency = (value: any) => {
  if (isNaN(value) || value === null) return value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (value: any) => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const formatBoolean = (value: any) => (value ? 'Sim' : 'Não');

const countFilledFields = (obj: any) => {
  let count = 0;
  const countRecursive = (data: any) => {
    if (data === null || data === undefined || data === '') return;
    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.values(data).forEach(countRecursive);
    } else if (Array.isArray(data)) {
      data.forEach(countRecursive);
    } else {
      count++;
    }
  };
  countRecursive(obj);
  return count;
};

// --- Funções de Validação (Módulo 11) ---
const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

const validateCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  return true;
};


// --- Componente Principal ---
export default function App() {
  const [docType, setDocType] = useState<'CNPJ' | 'CPF'>('CNPJ');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [viewRaw, setViewRaw] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  const handleTypeChange = (type: 'CNPJ' | 'CPF') => {
    setDocType(type);
    setInputValue('');
    setError(null);
    setData(null);
    setViewRaw(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(docType === 'CNPJ' ? formatCNPJ(val) : formatCPF(val));
  };

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDoc = inputValue.replace(/\D/g, '');
    
    setError(null);
    setData(null);
    setViewRaw(false);
    setCopySuccess('');

    if (docType === 'CNPJ') {
      if (cleanDoc.length !== 14 || !validateCNPJ(cleanDoc)) {
        setError('Por favor, insira um CNPJ válido.');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanDoc}`);
        if (!response.ok) throw new Error('CNPJ não encontrado ou erro na API.');
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }

    } else {
      // Logic for CPF
      if (cleanDoc.length !== 11 || !validateCPF(cleanDoc)) {
        setError('Por favor, insira um CPF válido.');
        return;
      }
      setLoading(true);
      
      // Simulando delay de rede
      setTimeout(() => {
        setData({
          status_validacao: "Válido",
          documento: formatCPF(cleanDoc),
          restricao_lgpd: true,
          aviso_legal: "Não existem APIs públicas abertas para consulta de CPF por determinação da Lei Geral de Proteção de Dados (LGPD).",
          nota_tecnica: "A validação matemática (Módulo 11) passou com sucesso. Para obter dados reais de pessoa física, você precisará integrar uma API de bureau de crédito privada e autenticada (ex: Serasa, SPC) neste bloco de código."
        });
        setLoading(false);
      }, 600);
    }
  };

  const copyToClipboard = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess('Copiado!');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  // Renderizador Dinâmico Recursivo
  const renderDynamicData = (key: string, value: any, level = 0): React.ReactNode => {
    const isRoot = level === 0;
    const paddingLeft = isRoot ? '' : 'pl-4 border-l-2 border-gray-200 mt-2';

    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'boolean') {
      return (
        <div key={key} className={`mb-2 ${paddingLeft}`}>
          <span className="font-semibold text-gray-700 capitalize">{key.replace(/_/g, ' ')}: </span>
          <span className="text-gray-600">{formatBoolean(value)}</span>
        </div>
      );
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div key={key} className={`mb-2 ${paddingLeft}`}>
          <span className="font-semibold text-blue-800 capitalize text-lg">{key.replace(/_/g, ' ')}</span>
          <div className="mt-1">
            {Object.entries(value).map(([k, v]) => renderDynamicData(k, v, level + 1))}
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      
      // Destaca a seção de sócios visualmente
      const isSocios = key.toLowerCase() === 'socios';
      const bgColor = isSocios ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100';
      const titleColor = isSocios ? 'text-indigo-800' : 'text-blue-800';

      return (
        <div key={key} className={`mb-4 ${paddingLeft}`}>
          <span className={`font-bold ${titleColor} capitalize text-lg flex items-center gap-2`}>
            {isSocios && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            )}
            {key.replace(/_/g, ' ')} ({value.length})
          </span>
          <div className="mt-2 space-y-3">
            {value.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg border shadow-sm transition-all hover:shadow-md ${bgColor}`}>
                {typeof item === 'object' && item !== null
                  ? Object.entries(item).map(([k, v]) => renderDynamicData(k, v, level + 1))
                  : <span className="text-gray-600">{item}</span>
                }
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Formatações específicas baseadas no nome da chave (heurística simples)
    let finalValue = value;
    const keyLower = key.toLowerCase();
    if (keyLower.includes('cep')) finalValue = formatCEP(value);
    else if (keyLower.includes('data')) finalValue = formatDate(value);
    else if (keyLower.includes('capital_social') || keyLower.includes('valor')) finalValue = formatCurrency(value);

    return (
      <div key={key} className={`mb-2 ${paddingLeft}`}>
        <span className="font-semibold text-gray-700 capitalize">{key.replace(/_/g, ' ')}: </span>
        <span className="text-gray-600">{finalValue}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header e Busca */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              Consulta de Documentos
            </h1>
            
            {/* Toggle Tipo de Documento */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleTypeChange('CNPJ')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${docType === 'CNPJ' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                CNPJ
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('CPF')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${docType === 'CPF' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                CPF
              </button>
            </div>
          </div>

          <form onSubmit={handleConsultar} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={docType === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg"
              maxLength={docType === 'CNPJ' ? 18 : 14}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center min-w-[140px] text-lg shadow-sm"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Consultar'}
            </button>
          </form>
          {error && <p className="mt-4 text-red-500 text-sm flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{error}</p>}
        </div>

        {/* Resultados */}
        {data && (
          <div className="space-y-6 animate-fade-in">
            
            {/* View Customizada: CPF Mock */}
            {docType === 'CPF' && (
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                 <div className="flex items-start gap-3">
                   <svg className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   <div>
                     <h2 className="text-lg font-bold text-amber-900">Validação Concluída</h2>
                     <p className="text-amber-800 mt-1">O CPF <strong>{data.documento}</strong> passou pela validação matemática oficial do Módulo 11.</p>
                     <p className="text-sm text-amber-700 mt-3 border-t border-amber-200 pt-3">{data.nota_tecnica}</p>
                   </div>
                 </div>
              </div>
            )}

            {/* View Customizada: Resumo CNPJ (Apenas renderiza se for um retorno real de CNPJ) */}
            {docType === 'CNPJ' && data.estabelecimento && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Resumo da Empresa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Razão Social</p>
                    <p className="font-semibold text-gray-800">{data.razao_social || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nome Fantasia</p>
                    <p className="font-semibold text-gray-800">{data.estabelecimento?.nome_fantasia || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Situação Cadastral</p>
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${data.estabelecimento?.situacao_cadastral === 'Ativa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {data.estabelecimento?.situacao_cadastral || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CNAE Principal</p>
                    <p className="text-gray-800">{data.estabelecimento?.atividade_principal?.descricao || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Endereço</p>
                    <p className="text-gray-800">{`${data.estabelecimento?.tipo_logradouro || ''} ${data.estabelecimento?.logradouro || ''}, ${data.estabelecimento?.numero || ''}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cidade / UF</p>
                    <p className="text-gray-800">{`${data.estabelecimento?.cidade?.nome || ''} / ${data.estabelecimento?.estado?.sigla || ''}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contato</p>
                    <p className="text-gray-800">{data.estabelecimento?.telefone1 || 'Sem telefone'} | {data.estabelecimento?.email || 'Sem e-mail'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inscrições Estaduais</p>
                    <p className="text-gray-800">{data.estabelecimento?.inscricoes_estaduais?.length ? data.estabelecimento.inscricoes_estaduais.map((ie: any) => ie.inscricao_estadual).join(', ') : 'Nenhuma'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ações e Contadores (Comum para ambos) */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Chaves renderizadas: <span className="font-bold">{countFilledFields(data)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewRaw(!viewRaw)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                  {viewRaw ? 'Ocultar JSON' : 'Ver JSON Bruto'}
                </button>
                <button onClick={copyToClipboard} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  {copySuccess || 'Copiar JSON'}
                </button>
              </div>
            </div>

            {/* View JSON Bruto */}
            {viewRaw && (
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-green-400 text-xs font-mono">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}

            {/* Renderização Dinâmica de TODOS os dados */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Explorador Completo de Dados</h2>
              <div className="text-sm">
                {Object.entries(data).map(([key, value]) => renderDynamicData(key, value))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
