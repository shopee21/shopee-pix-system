const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'shopee-secret-key-2024';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shopee:Bm220832@cluster0.ziacita.mongodb.net/shopee-pix?retryWrites=true&w=majority&appName=Cluster0';

// MIDDLEWARES
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// CONECTAR AO MONGODB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ CONECTADO AO MONGODB!'))
  .catch(err => console.error('❌ ERRO MongoDB:', err.message));

// SCHEMAS
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const PaymentSchema = new mongoose.Schema({
  valor: { type: Number, required: true },
  pixCode: { type: String, required: true },
  vencimento: { type: Date, required: true },
  qrCodeUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', PaymentSchema);

// MIDDLEWARE DE AUTENTICAÇÃO
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
};

// CRIAR ADMIN PADRÃO
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('shopee2024', 10);
      await User.create({ username: 'admin', password: hashedPassword });
      console.log('✅ ADMIN CRIADO');
      console.log('   Usuário: admin');
      console.log('   Senha: shopee2024');
    } else {
      console.log('ℹ️  Admin já existe');
    }
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  }
}

mongoose.connection.once('open', () => {
  createDefaultAdmin();
});

// ==================== ROTAS DA API ====================

// Status da API
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'API Shopee Pix funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Tentativa de login recebida');
    console.log('📦 Body:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('❌ Dados incompletos');
      return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
    }
    
    const user = await User.findOne({ username });
    console.log('👤 Usuário encontrado:', user ? 'Sim' : 'Não');
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return res.status(401).json({ message: 'Usuário ou senha incorretos' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('🔑 Senha válida:', validPassword ? 'Sim' : 'Não');
    
    if (!validPassword) {
      console.log('❌ Senha incorreta');
      return res.status(401).json({ message: 'Usuário ou senha incorretos' });
    }
    
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ Login bem-sucedido!');
    
    res.json({ token, message: 'Login realizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
});

// Verificar token
app.get('/api/verify-token', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Listar pagamentos
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pagamentos' });
  }
});

// Criar pagamento
app.post('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { valor, pixCode, vencimento, qrCodeUrl } = req.body;
    const payment = await Payment.create({ valor, pixCode, vencimento, qrCodeUrl });
    console.log('✅ Pagamento criado:', payment._id);
    res.status(201).json(payment);
  } catch (error) {
    console.error('❌ Erro ao criar pagamento:', error);
    res.status(500).json({ message: 'Erro ao criar pagamento' });
  }
});

// Atualizar pagamento
app.put('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { valor, pixCode, vencimento, qrCodeUrl } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      id, 
      { valor, pixCode, vencimento, qrCodeUrl }, 
      { new: true }
    );
    if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado' });
    console.log('✅ Pagamento atualizado:', id);
    res.json(payment);
  } catch (error) {
    console.error('❌ Erro ao atualizar pagamento:', error);
    res.status(500).json({ message: 'Erro ao atualizar pagamento' });
  }
});

// Deletar pagamento
app.delete('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado' });
    console.log('✅ Pagamento deletado:', id);
    res.json({ message: 'Pagamento deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar pagamento:', error);
    res.status(500).json({ message: 'Erro ao deletar pagamento' });
  }
});

// ==================== ROTAS HTML ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/pagamento', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ message: 'Rota não encontrada' });
  }
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════╗');
  console.log('║  🚀 SERVIDOR SHOPEE PIX ONLINE    ║');
  console.log('╚═══════════════════════════════════╝');
  console.log('');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🔐 Admin: /pagamento#admin`);
  console.log(`👤 Usuário: admin`);
  console.log(`🔑 Senha: shopee2024`);
  console.log('');
});