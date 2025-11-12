const { useState, useEffect } = React;

const getAPIUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  return `${window.location.origin}/api`;
};

const API_URL = getAPIUrl();
console.log('🔍 API_URL:', API_URL);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const ShopeePixPayment = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [copied, setCopied] = useState(false);
  const [payments, setPayments] = useState([]);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const path = window.location.hash;
    if (path === '#admin') {
      if (authToken) {
        verifyToken();
      } else {
        setShowLogin(true);
      }
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    if (!currentPayment) return;
    const updateTimer = () => {
      const result = getTimeRemaining(currentPayment.vencimento);
      setTimeRemaining(result);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentPayment]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_URL}/verify-token`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        setIsAdmin(true);
        setShowLogin(false);
      } else {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setShowLogin(true);
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      setShowLogin(true);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setLoginError('');
    try {
      console.log('🔐 Login em:', `${API_URL}/login`);
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      console.log('📡 Status:', response.status);
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setAuthToken(data.token);
        setIsAdmin(true);
        setShowLogin(false);
        window.location.hash = 'admin';
      } else {
        setLoginError(data.message || 'Usuário ou senha incorretos');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      setLoginError(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setIsAdmin(false);
    setLoginData({ username: '', password: '' });
    window.location.hash = '';
  };

  const loadPayments = async () => {
    try {
      const response = await fetch(`${API_URL}/payments`);
      const data = await response.json();
      if (response.ok) {
        setPayments(data);
        if (data.length > 0 && !currentPayment) {
          setCurrentPayment(data[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getTimeRemaining = (vencimento) => {
    const now = new Date();
    const expiry = new Date(vencimento);
    const diff = expiry - now;
    if (diff <= 0) return 'Expirado';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')} horas ${String(minutes).padStart(2, '0')} minutos ${String(seconds).padStart(2, '0')} segundos`;
  };

  const formatVencimento = (vencimento) => {
    const date = new Date(vencimento);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).replace('.', '');
  };

  if (showLogin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-4 shadow-lg">
              <LockIcon />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Área Administrativa</h1>
            <p className="text-gray-600">Acesso restrito aos administradores</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usuário</label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                placeholder="Digite seu usuário"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition pr-12"
                  placeholder="Digite sua senha"
                  disabled={loading}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  type="button"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">📌 Credenciais padrão:</p>
              <p>Usuário: <code className="bg-blue-100 px-2 py-1 rounded font-mono">admin</code></p>
              <p>Senha: <code className="bg-blue-100 px-2 py-1 rounded font-mono">shopee2024</code></p>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-bold text-lg hover:from-orange-600 hover:to-red-600 transition shadow-lg disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <button
              onClick={() => { setShowLogin(false); window.location.hash = ''; }}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Voltar para Pagamentos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminPanel onLogout={handleLogout} authToken={authToken} loadPayments={loadPayments} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-2xl p-2.5 shadow-lg">
              <img 
                src="/shopee-logo.png" 
                alt="Shopee Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Shopee Pay</h1>
              <p className="text-xs text-orange-100">Pagamento Seguro</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
          <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm font-medium">Pagamento Total</span>
              <span className="text-2xl font-bold text-orange-600">
                {currentPayment ? formatCurrency(currentPayment.valor) : 'R$0,00'}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="mb-5">
              <p className="text-gray-700 text-sm font-semibold mb-2">Pagar em até</p>
              <div className="bg-orange-50 p-3 rounded">
                <p className="text-orange-600 font-bold text-base">{timeRemaining || 'Carregando...'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Vencimento em {currentPayment ? formatVencimento(currentPayment.vencimento) : ''}
                </p>
              </div>
            </div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-teal-500 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <span className="font-semibold text-base">Pix</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-center items-center">
                {currentPayment ? (
                  <img src={currentPayment.qrCodeUrl} alt="QR Code Pix" className="w-60 h-60 object-contain" />
                ) : (
                  <div className="w-60 h-60 bg-gray-100 flex items-center justify-center rounded">
                    <p className="text-gray-400 text-sm">Nenhum pagamento disponível</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => currentPayment && copyToClipboard(currentPayment.pixCode)}
                disabled={!currentPayment}
                className="w-full mt-3 bg-white border border-orange-500 text-orange-500 py-2.5 rounded font-semibold text-sm flex items-center justify-center gap-2 hover:bg-orange-50 transition disabled:opacity-50"
              >
                {copied ? (<><CheckIcon />Código Copiado!</>) : (<><CopyIcon />Copiar Código Pix</>)}
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-semibold text-gray-800 text-sm mb-3">Por favor, siga as instruções:</p>
              <div className="space-y-2.5">
                <div className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 mt-0.5">1</div>
                  <p className="text-xs text-gray-700 leading-relaxed">Acesse o app do seu banco ou internet banking de preferência.</p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 mt-0.5">2</div>
                  <p className="text-xs text-gray-700 leading-relaxed">Escolha pagar via Pix.</p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 mt-0.5">3</div>
                  <p className="text-xs text-gray-700 leading-relaxed">Escaneie o QR Code ou copie e cole o código Pix acima.</p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 mt-0.5">4</div>
                  <p className="text-xs text-gray-700 leading-relaxed">Seu pagamento será aprovado em alguns segundos.</p>
                </div>
              </div>
            </div>
            <button className="w-full bg-orange-500 text-white py-3 rounded font-bold text-sm hover:bg-orange-600 transition shadow-sm">OK</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ onLogout, authToken, loadPayments }) => {
  const [payments, setPayments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ id: '', valor: '', pixCode: '', vencimento: '', qrCodeImage: '' });

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_URL}/payments`, { headers: { 'Authorization': `Bearer ${authToken}` }});
      const data = await response.json();
      if (response.ok) setPayments(data);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.valor || !formData.pixCode || !formData.vencimento) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    setLoading(true);
    const payment = {
      ...formData,
      qrCodeUrl: formData.qrCodeImage || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(formData.pixCode)}`
    };
    try {
      const url = formData.id ? `${API_URL}/payments/${formData.id}` : `${API_URL}/payments`;
      const method = formData.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(payment)
      });
      if (response.ok) {
        await fetchPayments();
        await loadPayments();
        setShowForm(false);
        setFormData({ id: '', valor: '', pixCode: '', vencimento: '', qrCodeImage: '' });
      } else {
        alert('Erro ao salvar pagamento');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) return;
    try {
      const response = await fetch(`${API_URL}/payments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        await fetchPayments();
        await loadPayments();
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { setFormData({...formData, qrCodeImage: event.target.result}); };
      reader.readAsDataURL(file);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatVencimento = (vencimento) => {
    const date = new Date(vencimento);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).replace('.', '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur rounded-lg p-2"><LockIcon /></div>
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-xs text-orange-100">Shopee Pay Manager</p>
            </div>
          </div>
          <button onClick={onLogout} className="bg-white text-orange-500 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition">Sair</button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Gerenciar Pagamentos Pix</h2>
            <button onClick={() => setShowForm(!showForm)} className="bg-orange-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition shadow">+ Novo Pagamento</button>
          </div>
          {showForm && (
            <div className="bg-gradient-to-br from-gray-50 to-orange-50 p-6 rounded-xl mb-6 border-2 border-orange-200">
              <h3 className="font-bold text-lg text-gray-800 mb-4">{formData.id ? 'Editar Pagamento' : 'Criar Novo Pagamento'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Valor (R$)</label>
                  <input type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition" placeholder="23.49" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vencimento</label>
                  <input type="datetime-local" value={formData.vencimento} onChange={(e) => setFormData({...formData, vencimento: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Código Pix (Copia e Cola)</label>
                  <textarea value={formData.pixCode} onChange={(e) => setFormData({...formData, pixCode: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none h-28 font-mono text-sm" placeholder="00020126330014br.gov.bcb.pix..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Imagem do QR Code (opcional)</label>
                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 hover:border-orange-500 transition bg-white">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="qr-upload" />
                    <label htmlFor="qr-upload" className="cursor-pointer flex flex-col items-center gap-3">
                      {formData.qrCodeImage ? (
                        <div className="text-center">
                          <img src={formData.qrCodeImage} alt="Preview QR Code" className="w-40 h-40 mx-auto mb-3 rounded-lg border-4 border-orange-500 shadow-lg" />
                          <p className="text-sm text-green-600 font-bold">✓ Imagem carregada</p>
                          <p className="text-xs text-gray-500 mt-1">Clique para alterar</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-700 font-semibold">Clique para fazer upload da imagem do QR Code</p>
                          <p className="text-xs text-gray-500">PNG, JPG até 5MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 transition shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Pagamento'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ id: '', valor: '', pixCode: '', vencimento: '', qrCodeImage: '' });
                  }}
                  className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Nenhum pagamento cadastrado</p>
                <p className="text-gray-400 text-sm mt-1">Clique em "Novo Pagamento" para começar</p>
              </div>
            ) : (
              payments.map((payment) => (
                <div key={payment._id} className="bg-white border-2 border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-orange-300 hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <img
                      src={payment.qrCodeUrl}
                      alt="QR Code"
                      className="w-20 h-20 rounded-lg border-2 border-orange-200"
                    />
                    <div>
                      <p className="font-bold text-xl text-orange-600">
                        {formatCurrency(payment.valor)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 Vence: {formatVencimento(payment.vencimento)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 font-mono bg-gray-50 px-2 py-1 rounded">
                        {payment.pixCode.substring(0, 35)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          id: payment._id,
                          valor: payment.valor,
                          pixCode: payment.pixCode,
                          vencimento: payment.vencimento,
                          qrCodeImage: payment.qrCodeUrl
                        });
                        setShowForm(true);
                      }}
                      className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deletePayment(payment._id)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<ShopeePixPayment />, document.getElementById('root'));