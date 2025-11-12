const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'shopee-secret-key-2024';
const MONGODB_URI = 'mongodb+srv://shopee:Bm220832@cluster0.ziacita.mongodb.net/shopee-pix?retryWrites=true&w=majority&appName=Cluster0';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('\n✅ CONECTADO AO MONGODB!\n');
  })
  .catch(err => {
    console.error('❌ ERRO MongoDB:', err.message);
  });

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

async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('shopee2024', 10);
      await User.create({ username: 'admin', password: hashedPassword });
      console.log('✅ ADMIN CRIADO!');
      console.log('👤 Login: admin');
      console.log('🔑 Senha: shopee2024\n');
    }
  } catch (error) {
    console.error('Erro ao criar admin:', error);
  }
}

mongoose.connection.once('open', () => {
  createDefaultAdmin();
});

app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'API Shopee Pix funcionando!' });
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Usuário ou senha incorretos' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Usuário ou senha incorretos' });
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Login realizado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/verify-token', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.get('/api/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pagamentos' });
  }
});

app.post('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { valor, pixCode, vencimento, qrCodeUrl } = req.body;
    const payment = await Payment.create({ valor, pixCode, vencimento, qrCodeUrl });
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar pagamento' });
  }
});

app.put('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { valor, pixCode, vencimento, qrCodeUrl } = req.body;
    const payment = await Payment.findByIdAndUpdate(id, { valor, pixCode, vencimento, qrCodeUrl }, { new: true });
    if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar pagamento' });
  }
});

app.delete('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado' });
    res.json({ message: 'Pagamento deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar pagamento' });
  }
});

// Servir arquivos estáticos do frontend
app.use(express.static('frontend'));

// Rota para a página principal
app.get('/pagamento', (req, res) => {
  res.sendFile(__dirname + '/frontend/index.html');
});

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════╗');
  console.log('║  🚀 SERVIDOR SHOPEE PIX ONLINE    ║');
  console.log('╚════════════════════════════════════╝');
  console.log(`\n📡 Site: http://localhost:${PORT}`);
  console.log(`📡 Site: http://localhost:${PORT}/pagamento`);
  console.log(`🔐 Admin: http://localhost:${PORT}#admin`);
  console.log(`🔐 Admin: http://localhost:${PORT}/pagamento#admin\n`);
});