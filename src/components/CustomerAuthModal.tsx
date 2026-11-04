import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ModalShell } from './ui/ModalShell';
import { formatCPF, validateCPF, formatPhone, formatCEP, fetchAddressByCep, validateEmail, formatCurrency } from '../utils/validators';
import { 
  X, 
  User, 
  ShoppingBag, 
  Heart, 
  Package, 
  Truck, 
  LogOut, 
  Sparkles, 
  Lock, 
  CheckCircle2,
  Ban,
  ExternalLink,
  Mail,
  Eye,
  EyeOff,
  FileText,
  Phone,
  Gift,
  Ruler,
  Search,
  Filter,
  CreditCard,
  QrCode,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  MapPin,
  Clock,
  ShieldCheck,
  Tag,
  Plus,
  Trash2,
  Edit3,
  Star,
  Home,
  Briefcase,
  Navigation
} from 'lucide-react';

export const CustomerAuthModal: React.FC = () => {
  const {
    isAuthOpen,
    setIsAuthOpen,
    customerUser,
    login,
    register,
    logout,
    updateCustomerProfile,
    orders,
    refreshOrders,
    wishlist,
    products,
    addToCart,
    setSelectedProductDetail,
    openProvadorVirtual,
    customization
  } = useStore();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'profile'>(
    customerUser ? 'profile' : 'login'
  );

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

// Customer Profile Tabs & Filters
  const [profileTab, setProfileTab] = useState<'purchases' | 'favorites' | 'account'>('purchases');

  // Edit Profile States
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editCep, setEditCep] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editComplement, setEditComplement] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCurrentPass, setEditCurrentPass] = useState('');
  const [editNewPass, setEditNewPass] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Address Manager States
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState<{
    label: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    isPrimary: boolean;
  }>({
    label: 'Casa',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    isPrimary: false
  });
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Sync profile edit form with customerUser data
  useEffect(() => {
    if (!isAuthOpen || profileTab !== 'purchases') return;
    refreshOrders();
    const timer = setInterval(() => {
      refreshOrders();
    }, 6000);
    return () => clearInterval(timer);
  }, [isAuthOpen, profileTab, refreshOrders]);

  useEffect(() => {
    if (customerUser) {
      setEditName(customerUser.name || customerUser.fullName || '');
      setEditPhone(customerUser.phone || '');
      setEditCpf(customerUser.cpf || '');
      const primaryAddr = customerUser.addresses?.[0];
      if (primaryAddr) {
        setEditCep(primaryAddr.cep || '');
        setEditStreet(primaryAddr.street || '');
        setEditNumber(primaryAddr.number || '');
        setEditComplement(primaryAddr.complement || '');
        setEditNeighborhood(primaryAddr.neighborhood || '');
        setEditCity(primaryAddr.city || '');
        setEditState(primaryAddr.state || '');
      }
    }
  }, [customerUser]);

  const handleCepLookup = async (cepVal: string) => {
    const formatted = formatCEP(cepVal);
    setEditCep(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      const addr = await fetchAddressByCep(clean);
      if (addr) {
        setEditStreet(addr.street);
        setEditNeighborhood(addr.neighborhood);
        setEditCity(addr.city);
        setEditState(addr.state);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditErrorMsg(null);
    setEditSuccessMsg(null);

    try {
      const payload: any = {
        fullName: editName.trim(),
        phone: editPhone.trim(),
        cpf: editCpf.trim()
      };

      if (editStreet.trim() && editCep.trim()) {
        payload.address = {
          cep: editCep.trim(),
          street: editStreet.trim(),
          number: editNumber.trim(),
          complement: editComplement.trim(),
          neighborhood: editNeighborhood.trim(),
          city: editCity.trim(),
          state: editState.trim().toUpperCase()
        };
      }

      if (editNewPass.trim()) {
        payload.currentPassword = editCurrentPass;
        payload.newPassword = editNewPass.trim();
      }

      const res = await updateCustomerProfile(payload);
      if (res.ok) {
        setEditCurrentPass('');
        setEditNewPass('');
        setEditSuccessMsg('Dados cadastrais atualizados com sucesso!');
        setTimeout(() => setEditSuccessMsg(null), 4000);
      } else {
        setEditErrorMsg(res.error || 'Erro ao atualizar dados cadastrais.');
      }
    } catch (err: any) {
      setEditErrorMsg(err?.message || 'Erro ao atualizar perfil.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddrCepChange = async (val: string) => {
    const formatted = formatCEP(val);
    setAddrForm((prev) => ({ ...prev, cep: formatted }));
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsSearchingCep(true);
      try {
        const addr = await fetchAddressByCep(clean);
        if (addr) {
          setAddrForm((prev) => ({
            ...prev,
            street: addr.street || prev.street,
            neighborhood: addr.neighborhood || prev.neighborhood,
            city: addr.city || prev.city,
            state: (addr.state || prev.state).toUpperCase()
          }));
        }
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleOpenAddAddress = () => {
    const currentList = customerUser?.addresses || [];
    setEditingAddressId(null);
    setAddrForm({
      label: currentList.length === 0 ? 'Casa' : 'Outro',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      isPrimary: currentList.length === 0
    });
    setIsAddingAddress(true);
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setAddrForm({
      label: addr.label || 'Casa',
      cep: addr.cep || '',
      street: addr.street || '',
      number: addr.number || '',
      complement: addr.complement || '',
      neighborhood: addr.neighborhood || '',
      city: addr.city || '',
      state: addr.state || '',
      isPrimary: Boolean(addr.isPrimary)
    });
    setIsAddingAddress(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.cep.trim() || !addrForm.street.trim() || !addrForm.number.trim() || !addrForm.city.trim() || !addrForm.state.trim()) {
      setAddressFeedback({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios (CEP, Rua, Número, Cidade e UF).' });
      setTimeout(() => setAddressFeedback(null), 3500);
      return;
    }

    setAddressLoading(true);
    try {
      const currentList = [...(customerUser?.addresses || [])];
      let updatedList = [];

      const newAddr = {
        id: editingAddressId || `addr-${Date.now()}`,
        label: addrForm.label.trim() || 'Principal',
        isPrimary: Boolean(addrForm.isPrimary || currentList.length === 0),
        cep: addrForm.cep.trim(),
        street: addrForm.street.trim(),
        number: addrForm.number.trim(),
        complement: addrForm.complement.trim(),
        neighborhood: addrForm.neighborhood.trim(),
        city: addrForm.city.trim(),
        state: addrForm.state.trim().toUpperCase()
      };

      if (editingAddressId) {
        updatedList = currentList.map((a) => (a.id === editingAddressId ? newAddr : a));
      } else {
        updatedList = [...currentList, newAddr];
      }

      // If marked primary, ensure other addresses are not primary
      if (newAddr.isPrimary) {
        updatedList = updatedList.map((a) => ({
          ...a,
          isPrimary: a.id === newAddr.id
        }));
      } else if (!updatedList.some((a) => a.isPrimary) && updatedList.length > 0) {
        updatedList[0].isPrimary = true;
      }

      const res = await updateCustomerProfile({ addresses: updatedList });
      if (res.ok) {
        setIsAddingAddress(false);
        setEditingAddressId(null);
        setAddressFeedback({ type: 'success', text: 'Endereço salvo com sucesso!' });
        setTimeout(() => setAddressFeedback(null), 3000);
      } else {
        setAddressFeedback({ type: 'error', text: res.error || 'Falha ao salvar endereço.' });
        setTimeout(() => setAddressFeedback(null), 3500);
      }
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetPrimaryAddress = async (addrId: string) => {
    const currentList = [...(customerUser?.addresses || [])];
    const updatedList = currentList.map((a) => ({
      ...a,
      isPrimary: a.id === addrId
    }));
    const res = await updateCustomerProfile({ addresses: updatedList });
    if (res.ok) {
      setAddressFeedback({ type: 'success', text: 'Endereço principal atualizado com sucesso!' });
      setTimeout(() => setAddressFeedback(null), 2500);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este endereço salvo?')) return;
    const currentList = (customerUser?.addresses || []).filter((a) => a.id !== addrId);
    if (currentList.length > 0 && !currentList.some((a) => a.isPrimary)) {
      currentList[0].isPrimary = true;
    }
    const res = await updateCustomerProfile({ addresses: currentList });
    if (res.ok) {
      setAddressFeedback({ type: 'success', text: 'Endereço removido.' });
      setTimeout(() => setAddressFeedback(null), 2500);
    }
  };
  const [searchItem, setSearchItem] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('recente');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Pedidos reais desta cliente (a API já filtra pelo e-mail autenticado)
  const customerOrders = orders;

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(code);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const stats = {
    totalOrders: customerOrders.length,
    totalSpent: customerOrders
      .filter((o) => o.paymentStatus === 'confirmado' || o.orderStatus === 'pago')
      .reduce((sum, o) => sum + (o.total || 0), 0),
    totalPieces: customerOrders.reduce(
      (sum, o) => sum + (o.items || []).reduce((s, it) => s + (it.quantity || 1), 0),
      0
    )
  };

  const filteredOrders = customerOrders
    .filter((ord) => {
      // 1. Busca por produto ou código
      if (searchItem.trim()) {
        const q = searchItem.trim().toLowerCase();
        const matchId = ord.id.toLowerCase().includes(q);
        const matchItem = (ord.items || []).some((it) => it.name.toLowerCase().includes(q));
        if (!matchId && !matchItem) return false;
      }

      // 2. Forma de pagamento
      if (paymentFilter !== 'all') {
        if (paymentFilter === 'pix' && ord.paymentMethod !== 'pix') return false;
        if (paymentFilter === 'card' && ord.paymentMethod !== 'credit_card') return false;
        if (paymentFilter === 'boleto' && ord.paymentMethod !== 'boleto') return false;
      }

      // 3. Status do pedido
      if (statusFilter !== 'all') {
        if (ord.orderStatus !== statusFilter) return false;
      }

      // 4. Período / data
      if (dateFilter !== 'all') {
        const orderTime = new Date(ord.createdAt).getTime();
        const now = Date.now();
        if (dateFilter === '7d' && now - orderTime > 7 * 864e5) return false;
        if (dateFilter === '30d' && now - orderTime > 30 * 864e5) return false;
        if (dateFilter === '90d' && now - orderTime > 90 * 864e5) return false;
        if (dateFilter === 'year') {
          if (new Date(ord.createdAt).getFullYear() !== new Date().getFullYear()) return false;
        }
      }

      // 5. Faixa de preço
      const min = parseFloat(priceMin);
      if (!isNaN(min) && min > 0 && ord.total < min) return false;
      const max = parseFloat(priceMax);
      if (!isNaN(max) && max > 0 && ord.total > max) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'maior_valor') return b.total - a.total;
      if (sortOption === 'menor_valor') return a.total - b.total;
      if (sortOption === 'antigo') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const hasActiveFilters = Boolean(
    searchItem.trim() ||
      paymentFilter !== 'all' ||
      statusFilter !== 'all' ||
      dateFilter !== 'all' ||
      sortOption !== 'recente' ||
      priceMin ||
      priceMax
  );

  const clearFilters = () => {
    setSearchItem('');
    setPaymentFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSortOption('recente');
    setPriceMin('');
    setPriceMax('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!validateEmail(loginEmail)) {
      setLoginError('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    if (loginPassword.length < 8) {
      setLoginError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setLoginLoading(true);
    const result = await login(loginEmail.trim(), loginPassword);
    setLoginLoading(false);

    if (!result.ok) {
      setLoginError(result.error || 'Não foi possível entrar.');
      return;
    }
    setLoginPassword('');
    setAuthMode('profile');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regName.trim().split(' ').length < 2) {
      setRegError('Digite seu nome e sobrenome completo.');
      return;
    }

    if (!validateCPF(regCpf)) {
      setRegError('CPF inválido de acordo com a Receita Federal.');
      return;
    }

    if (!validateEmail(regEmail)) {
      setRegError('Digite um e-mail válido.');
      return;
    }

    if (regPhone.replace(/\D/g, '').length < 10) {
      setRegError('Telefone com DDD inválido.');
      return;
    }

    if (regPassword.length < 8) {
      setRegError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setRegLoading(true);
    const result = await register({
      name: regName.trim(),
      cpf: regCpf,
      email: regEmail.trim().toLowerCase(),
      phone: regPhone,
      password: regPassword
    });
    setRegLoading(false);

    if (!result.ok) {
      setRegError(result.error || 'Não foi possível criar sua conta.');
      return;
    }
    setRegPassword('');
    setAuthMode('profile');
  };

  const handleLogout = async () => {
    await logout();
    setAuthMode('login');
  };

  const wishedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <ModalShell
      open={isAuthOpen}
      onClose={() => setIsAuthOpen(false)}
      icon={<User size={22} />}
      eyebrow="Flor de Seda"
      title={customerUser ? `Olá, ${customerUser.name}` : 'Acesso da cliente'}
      subtitle={
        customerUser
          ? 'Painel da cliente — pedidos, medidas e histórico'
          : 'Entre ou crie sua conta para acompanhar pedidos e medidas'
      }
      size={customerUser ? 'xl' : 'md'}
      bodyClassName="!p-0"
    >
        {/* Exclusive Boutique Perks Strip */}
        {!customerUser && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-[#FFF5F8] to-[#FFF9FA] border-b border-rose-100 flex items-center justify-around text-[11px] text-stone-600">
            <span className="flex items-center gap-1.5 font-medium text-stone-700">
              <Package className="w-3.5 h-3.5 text-[#DC7898]" />
              Pedidos e rastreio
            </span>
            <span className="w-1 h-1 rounded-full bg-rose-200" />
            <span className="flex items-center gap-1.5 font-medium text-stone-700">
              <Ruler className="w-3.5 h-3.5 text-[#DC7898]" />
              Medidas no provador
            </span>
            <span className="w-1 h-1 rounded-full bg-rose-200" />
            <span className="flex items-center gap-1.5 font-medium text-stone-700">
              <Heart className="w-3.5 h-3.5 text-[#DC7898]" />
              Lista de desejos
            </span>
          </div>
        )}

        {/* Pill Navigation Toggle (if not logged in) */}
        {!customerUser && (
          <div className="p-4 pb-0 bg-white">
            <div className="flex bg-rose-50/80 p-1 rounded-full border border-rose-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setLoginError(null); }}
                className={`flex-1 py-2 rounded-full transition-all text-center ${
                  authMode === 'login'
                    ? 'bg-[#DC7898] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-[#DC7898]'
                }`}
              >
                Já sou Cliente (Entrar)
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setRegError(null); }}
                className={`flex-1 py-2 rounded-full transition-all text-center ${
                  authMode === 'register'
                    ? 'bg-[#DC7898] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-[#DC7898]'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* 1. LOGIN FORM */}
          {authMode === 'login' && !customerUser && (
            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto py-2 animate-fade-in">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  E-mail Cadastrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898] shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Sua Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const whatsapp = (customization?.whatsappNumber || '').replace(/\D/g, '');
                      window.open(
                        `https://wa.me/55${whatsapp}?text=${encodeURIComponent('Olá! Preciso redefinir a senha da minha conta.')}`,
                        '_blank',
                        'noopener'
                      );
                    }}
                    className="text-[11px] text-[#DC7898] hover:underline"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#DC7898] via-[#E283A1] to-[#D46889] hover:from-[#D46889] hover:to-[#C65677] text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-rose-200/60 hover:shadow-lg transition-all"
              >
                Entrar na Minha Conta
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-xs text-[#DC7898] hover:text-[#C65677] font-medium"
                >
                  Não tem conta? Criar minha conta
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {authMode === 'register' && !customerUser && (
            <form onSubmit={handleRegister} className="space-y-3.5 max-w-lg mx-auto py-1 animate-fade-in">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Amanda Silva Castro"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898] shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    CPF (Validação Oficial) *
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={regCpf}
                      onChange={(e) => setRegCpf(formatCPF(e.target.value))}
                      className="w-full bg-white border border-rose-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898] shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    WhatsApp com DDD *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                      value={regPhone}
                      onChange={(e) => setRegPhone(formatPhone(e.target.value))}
                      className="w-full bg-white border border-rose-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898] shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  E-mail *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898] shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Crie sua Senha (mínimo 6 dígitos) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {regError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#DC7898] via-[#E283A1] to-[#D46889] hover:from-[#D46889] hover:to-[#C65677] text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-rose-200/60 hover:shadow-lg transition-all"
              >
                Concluir Cadastro & Ganhar 10% OFF
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs text-stone-500 hover:text-[#DC7898]"
                >
                  Já possui conta? <span className="underline font-semibold text-[#DC7898]">Fazer Login</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. LOGGED IN CUSTOMER PROFILE VIEW */}
          {customerUser && (
            <div className="space-y-6 animate-fade-in">
              {/* Profile Header Card */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#FFF5F8] via-white to-[#FCEEF2] border border-rose-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#DC7898] to-[#F3A5BC] text-white font-fashion font-bold text-xl flex items-center justify-center shadow-xs shrink-0">
                    {customerUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-fashion text-lg font-bold text-stone-900 leading-tight">
                        {customerUser.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Verificada
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 font-mono mt-0.5">{customerUser.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-stone-500">
                      <span>CPF: <strong className="text-stone-700">{formatCPF(customerUser.cpf)}</strong></span>
                      <span>•</span>
                      <span>WhatsApp: <strong className="text-stone-700">{formatPhone(customerUser.phone)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={handleLogout}
                    className="px-3.5 py-2 rounded-full bg-white border border-rose-200 hover:border-rose-300 text-stone-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:bg-rose-50/70 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-rose-100 gap-2 pb-0">
                <button
                  type="button"
                  onClick={() => setProfileTab('purchases')}
                  className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    profileTab === 'purchases'
                      ? 'border-[#DC7898] text-[#DC7898]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Minhas Compras</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    profileTab === 'purchases' ? 'bg-rose-100 text-[#DC7898]' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {customerOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileTab('favorites')}
                  className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    profileTab === 'favorites'
                      ? 'border-[#DC7898] text-[#DC7898]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Favoritos</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    profileTab === 'favorites' ? 'bg-rose-100 text-[#DC7898]' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {wishedProducts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileTab('account')}
                  className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    profileTab === 'account'
                      ? 'border-[#DC7898] text-[#DC7898]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Dados Cadastrais</span>
                </button>
              </div>

              {/* TAB 1: PURCHASES / ORDERS */}
              {profileTab === 'purchases' && (
                <div className="space-y-4">
                  {/* Summary Metric Strip (Sem valor financeiro, métricas elegantes da cliente) */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 text-center shadow-2xs">
                      <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Pedidos</span>
                      <strong className="text-base sm:text-xl font-bold text-stone-800 tabular-nums mt-0.5 block">{stats.totalOrders}</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-100 text-center shadow-2xs">
                      <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block">Peças Compradas</span>
                      <strong className="text-base sm:text-xl font-bold text-rose-900 tabular-nums mt-0.5 block">{stats.totalPieces} un.</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 text-center shadow-2xs">
                      <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Peças Salvas</span>
                      <strong className="text-base sm:text-xl font-bold text-stone-800 tabular-nums mt-0.5 block">{wishedProducts.length} un.</strong>
                    </div>
                  </div>

                  {/* Advanced Filters Toolbar */}
                  <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs space-y-3">
                    {/* Search by Product or Order */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar por produto, peça comprada ou número do pedido..."
                        value={searchItem}
                        onChange={(e) => setSearchItem(e.target.value)}
                        className="w-full bg-stone-50/70 border border-rose-100 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898] transition-all"
                      />
                      {searchItem && (
                        <button
                          type="button"
                          onClick={() => setSearchItem('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded-full"
                          title="Limpar busca"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter Dropdowns Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* Forma de Pagamento */}
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                          Pagamento
                        </label>
                        <select
                          value={paymentFilter}
                          onChange={(e) => setPaymentFilter(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#DC7898]"
                        >
                          <option value="all">Todas as Formas</option>
                          <option value="pix">PIX Instantâneo</option>
                          <option value="card">Cartão de Crédito</option>
                          <option value="boleto">Boleto Bancário</option>
                        </select>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                          Status
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#DC7898]"
                        >
                          <option value="all">Todos os Status</option>
                          <option value="pago">Pago / Aprovado</option>
                          <option value="em_separacao">Em Separação</option>
                          <option value="enviado">Enviado / A Caminho</option>
                          <option value="entregue">Entregue</option>
                          <option value="aguardando_pagamento">Pendente</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>

                      {/* Período / Data */}
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                          Período
                        </label>
                        <select
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#DC7898]"
                        >
                          <option value="all">Todo o período</option>
                          <option value="7d">Últimos 7 dias</option>
                          <option value="30d">Últimos 30 dias</option>
                          <option value="90d">Últimos 90 dias</option>
                          <option value="year">Este ano</option>
                        </select>
                      </div>

                      {/* Ordenação */}
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                          Ordenar Por
                        </label>
                        <select
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#DC7898]"
                        >
                          <option value="recente">Mais recentes</option>
                          <option value="antigo">Mais antigos</option>
                          <option value="maior_valor">Maior valor</option>
                          <option value="menor_valor">Menor valor</option>
                        </select>
                      </div>
                    </div>

                    {/* Price Range Filter & Clear Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-rose-50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-stone-500 uppercase">Preço:</span>
                        <input
                          type="number"
                          placeholder="Mín R$"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                          className="w-20 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#DC7898]"
                        />
                        <span className="text-stone-400">até</span>
                        <input
                          type="number"
                          placeholder="Máx R$"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          className="w-20 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#DC7898]"
                        />
                      </div>

                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-[11px] font-semibold text-[#DC7898] hover:text-[#C65677] underline cursor-pointer"
                        >
                          Limpar Filtros
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Count Chip */}
                  <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                    <span>
                      Exibindo <strong className="text-stone-800">{filteredOrders.length}</strong> de <strong className="text-stone-800">{customerOrders.length}</strong> {customerOrders.length === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>

                  {/* Orders Cards List */}
                  {filteredOrders.length > 0 ? (
                    <div className="space-y-3">
                      {filteredOrders.map((ord) => {
                        const isExpanded = expandedOrderId === ord.id;
                        const isPaid = ord.paymentStatus === 'confirmado' || ord.orderStatus === 'pago';
                        const isPix = ord.paymentMethod === 'pix';

                        return (
                          <div
                            key={ord.id}
                            className="rounded-2xl bg-white border border-rose-100 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
                          >
                            {/* Card Header */}
                            <div className="p-4 bg-gradient-to-r from-[#FFFBFD] via-white to-[#FFF9FB] border-b border-rose-100 flex flex-wrap items-center justify-between gap-2.5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-stone-900 tracking-wide">
                                    {ord.id}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyTracking(ord.id)}
                                    title="Copiar código do pedido"
                                    className="p-1 rounded-md text-stone-400 hover:text-stone-700 transition-colors"
                                  >
                                    {copiedTracking === ord.id ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                                <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-stone-400" />
                                  <span>{new Date(ord.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {/* Payment Badge */}
                                {isPix ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                                    <QrCode className="w-3 h-3 text-emerald-600" />
                                    PIX
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold">
                                    <CreditCard className="w-3 h-3 text-indigo-600" />
                                    Cartão
                                  </span>
                                )}

                                {/* Status Badge */}
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    ord.orderStatus === 'entregue'
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                      : ord.orderStatus === 'enviado'
                                      ? 'bg-sky-100 text-sky-900 border border-sky-200'
                                      : ord.orderStatus === 'em_separacao'
                                      ? 'bg-rose-100 text-[#DC7898] border border-rose-200'
                                      : ord.orderStatus === 'cancelado'
                                      ? 'bg-stone-100 text-stone-700 border border-stone-300'
                                      : isPaid
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {ord.orderStatus === 'em_separacao'
                                    ? 'Em Separação'
                                    : ord.orderStatus === 'enviado'
                                    ? 'Enviado'
                                    : ord.orderStatus === 'entregue'
                                    ? 'Entregue'
                                    : ord.orderStatus === 'cancelado'
                                    ? 'Cancelado'
                                    : isPaid
                                    ? 'Aprovado'
                                    : 'Aguardando'}
                                </span>
                              </div>
                            </div>

                            {/* Stepper Visual de Rastreamento do Pedido */}
                            <div className="px-4 py-3 bg-[#FCF8FA] border-b border-rose-100">
                              {ord.orderStatus === 'cancelado' ? (
                                <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 text-xs">
                                  <Ban className="w-4 h-4 text-stone-500 shrink-0" />
                                  <span>Pedido cancelado. Qualquer dúvida ou estorno, fale diretamente conosco.</span>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 mb-2">
                                    <span className="font-semibold text-stone-800">
                                      {ord.orderStatus === 'entregue'
                                        ? 'Pacote entregue no destino'
                                        : ord.orderStatus === 'enviado'
                                        ? 'A caminho do seu endereço'
                                        : ord.orderStatus === 'em_separacao'
                                        ? 'Em preparação na loja Flor de Seda'
                                        : isPaid
                                        ? 'Pagamento aprovado · Aguardando separação'
                                        : 'Aguardando confirmação de pagamento'}
                                    </span>
                                    <span className="text-[10px] text-stone-400">
                                      Etapa {ord.orderStatus === 'entregue' ? '4 de 4' : ord.orderStatus === 'enviado' ? '3 de 4' : ord.orderStatus === 'em_separacao' ? '2 de 4' : '1 de 4'}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                      { label: '1. Aprovado', active: isPaid || ['em_separacao', 'enviado', 'entregue'].includes(ord.orderStatus) },
                                      { label: '2. Separação', active: ['em_separacao', 'enviado', 'entregue'].includes(ord.orderStatus) },
                                      { label: '3. A Caminho', active: ['enviado', 'entregue'].includes(ord.orderStatus) },
                                      { label: '4. Entregue', active: ord.orderStatus === 'entregue' }
                                    ].map((st, sIdx) => (
                                      <div key={sIdx} className="space-y-1">
                                        <div className={`h-1.5 rounded-full transition-all ${st.active ? 'bg-[#DC7898]' : 'bg-stone-200'}`} />
                                        <span className={`block text-[10px] text-center font-medium ${st.active ? 'text-[#DC7898] font-bold' : 'text-stone-400'}`}>
                                          {st.label}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Tracking Code Banner Oficial Validado */}
                            {ord.trackingCode && (
                              <div className="px-4 py-3 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/40 border-b border-sky-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                                    <Truck className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-sky-800">
                                        {ord.trackingCarrier || 'Correios Oficial'} · Rastreio Validado
                                      </span>
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    </div>
                                    <strong className="font-mono text-stone-900 text-xs tracking-wider block mt-0.5">
                                      {ord.trackingCode}
                                    </strong>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyTracking(ord.trackingCode!)}
                                    className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                                  >
                                    {copiedTracking === ord.trackingCode ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Copiado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copiar Código</span>
                                      </>
                                    )}
                                  </button>
                                  <a
                                    href={ord.trackingUrl || `https://rastreamento.correios.com.br/app/index.php?codigo=${ord.trackingCode}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs"
                                  >
                                    <span>Rastrear Objeto</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Items List */}
                            <div className="p-4 space-y-2.5">
                              {(ord.items || []).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 text-xs border-b border-rose-50 pb-2 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-3">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-12 h-14 rounded-xl object-cover border border-rose-100 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-12 h-14 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-300 shrink-0">
                                        <Package className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-semibold text-stone-900 line-clamp-1">{item.name}</p>
                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                                        {item.selectedSize && <span>Tam: <strong className="text-stone-700">{item.selectedSize}</strong></span>}
                                        {item.selectedColor && (
                                          <>
                                            <span>•</span>
                                            <span>Cor: <strong className="text-stone-700">{item.selectedColor.name}</strong></span>
                                          </>
                                        )}
                                        <span>•</span>
                                        <span>Qtd: <strong className="text-stone-700">{item.quantity}</strong></span>
                                      </div>
                                      <div className="mt-1">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                          ord.orderStatus === 'entregue'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : ord.orderStatus === 'enviado'
                                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                            : ord.orderStatus === 'em_separacao'
                                            ? 'bg-rose-50 text-[#DC7898] border border-rose-200'
                                            : isPaid
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-stone-50 text-stone-600 border border-stone-200'
                                        }`}>
                                          <Package className="w-3 h-3" />
                                          {ord.orderStatus === 'entregue'
                                            ? 'Item Entregue'
                                            : ord.orderStatus === 'enviado'
                                            ? 'Em Trânsito'
                                            : ord.orderStatus === 'em_separacao' ? 'Em Separação'
                                            : isPaid
                                            ? 'Pronto para Separação'
                                            : 'Aguardando Pagamento'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-bold text-stone-800 block text-xs">
                                      {formatCurrency(item.price * item.quantity)}
                                    </span>
                                    <span className="text-[10px] text-stone-400 block mt-0.5">
                                      {formatCurrency(item.price)} cada
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Card Footer: Total & Expand Toggle */}
                            <div className="p-4 pt-2 bg-stone-50/50 border-t border-rose-50 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                                className="text-[11px] font-semibold text-[#DC7898] hover:text-[#C65677] flex items-center gap-1 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Ocultar detalhes' : 'Ver detalhes da compra'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              <div className="text-right">
                                <span className="text-[10px] text-stone-400 block uppercase">Total do Pedido</span>
                                <span className="text-sm font-bold text-[#DC7898]">{formatCurrency(ord.total)}</span>
                              </div>
                            </div>

                            {/* Expanded Details Breakdown */}
                            {isExpanded && (
                              <div className="p-4 bg-rose-50/20 border-t border-rose-100 text-xs space-y-2 animate-fade-in">
                                <div className="grid sm:grid-cols-2 gap-3 pb-2 border-b border-rose-100">
                                  <div>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Endereço de Entrega</span>
                                    <p className="text-stone-700 mt-0.5">
                                      {ord.lead.street}, {ord.lead.number} {ord.lead.complement ? `· ${ord.lead.complement}` : ''}
                                    </p>
                                    <p className="text-stone-500 text-[11px]">
                                      {ord.lead.neighborhood} · {ord.lead.city}/{ord.lead.state} · CEP {ord.lead.cep}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Modalidade de Envio</span>
                                    <p className="text-stone-700 mt-0.5">{ord.shippingMethod || 'PAC Correios'}</p>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mt-2">Contato do Pedido</span>
                                    <p className="text-stone-600 text-[11px]">{ord.lead.phone} · {ord.lead.email}</p>
                                  </div>
                                </div>

                                <div className="space-y-1 pt-1 text-stone-600 text-xs max-w-xs ml-auto">
                                  <div className="flex justify-between">
                                    <span>Subtotal dos produtos:</span>
                                    <span className="font-semibold text-stone-800">{formatCurrency(ord.subtotal)}</span>
                                  </div>
                                  {ord.discount > 0 && (
                                    <div className="flex justify-between text-emerald-700">
                                      <span>Desconto / Cupom:</span>
                                      <span className="font-semibold">-{formatCurrency(ord.discount)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span>Frete:</span>
                                    <span className="font-semibold text-stone-800">{ord.shippingCost > 0 ? formatCurrency(ord.shippingCost) : 'Grátis'}</span>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-rose-100 text-sm font-bold text-stone-900">
                                    <span>Total Pago:</span>
                                    <span className="text-[#DC7898]">{formatCurrency(ord.total)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-rose-50/40 border border-dashed border-rose-200 text-center space-y-2">
                      <Package className="w-8 h-8 text-[#DC7898]/60 mx-auto" />
                      <p className="text-xs font-semibold text-stone-700">
                        {hasActiveFilters
                          ? 'Nenhuma compra corresponde aos filtros selecionados.'
                          : 'Você ainda não realizou pedidos na Flor de Seda.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="px-4 py-2 rounded-full bg-white border border-rose-200 text-[#DC7898] text-xs font-bold shadow-2xs hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Limpar Todos os Filtros
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAuthOpen(false)}
                          className="px-4 py-2 rounded-full bg-[#DC7898] text-white text-xs font-bold shadow-xs hover:bg-[#C65677] transition-colors cursor-pointer"
                        >
                          Explorar Peças da Coleção
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: WISHLIST FAVORITES */}
              {profileTab === 'favorites' && (
                <div>
                  {wishedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {wishedProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProductDetail(p);
                            setIsAuthOpen(false);
                          }}
                          className="cursor-pointer group p-3 rounded-2xl bg-white border border-rose-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <img src={p.images[0]} alt={p.name} className="w-full h-36 rounded-xl object-cover mb-2" />
                          <div>
                            <p className="font-medium text-xs text-stone-900 line-clamp-1 group-hover:text-[#DC7898]">
                              {p.name}
                            </p>
                            <span className="text-xs font-bold text-[#DC7898]">{formatCurrency(p.price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-rose-50/40 border border-dashed border-rose-200 text-center text-xs text-stone-500">
                      Você ainda não salvou peças como favoritas. Clique no ícone de coração nas peças da vitrine para salvar aqui!
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ACCOUNT DATA */}
              {profileTab === 'account' && (
                <div className="space-y-5 text-xs">
                  {/* Identificação e Segurança */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs space-y-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Identificação</span>
                      <p className="text-stone-800 font-semibold text-sm">{customerUser.name}</p>
                      <p className="text-stone-500 font-mono">CPF: {formatCPF(customerUser.cpf)}</p>
                      <p className="text-stone-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-stone-400" /> {customerUser.email}</p>
                      <p className="text-stone-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-stone-400" /> {formatPhone(customerUser.phone)}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Segurança & Suporte</span>
                        <p className="text-stone-600 mt-1">Sua conta é protegida com criptografia ponta a ponta e seus dados são restritos.</p>
                      </div>
                      <a
                        href={`https://wa.me/55${(customization?.whatsappNumber || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Sou a cliente ${customerUser.name} (${customerUser.email}) e gostaria de tirar uma dúvida sobre a minha conta.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold shadow-xs transition-all mt-2 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Falar com Atendimento WhatsApp</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* SEÇÃO: MEUS ENDEREÇOS DE ENTREGA (Gestão Avançada e Compra Rápida) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-rose-100 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
                      <div>
                        <h4 className="font-serif text-base font-medium text-stone-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#DC7898]" />
                          <span>Meus Endereços de Entrega</span>
                        </h4>
                        <p className="text-[11px] text-stone-500 font-light mt-0.5">
                          Cadastre seus endereços principais para preenchimento imediato e compra rápida com 1 clique no checkout.
                        </p>
                      </div>

                      {!isAddingAddress && (
                        <button
                          type="button"
                          onClick={handleOpenAddAddress}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#DC7898] hover:bg-[#C65677] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar Endereço</span>
                        </button>
                      )}
                    </div>

                    {/* Feedback message banner */}
                    {addressFeedback && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in ${
                          addressFeedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {addressFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{addressFeedback.text}</span>
                      </div>
                    )}

                    {/* FORMULÁRIO DE ADIÇÃO / EDIÇÃO DE ENDEREÇO */}
                    {isAddingAddress ? (
                      <form onSubmit={handleSaveAddress} className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-rose-50/40 via-white to-rose-50/20 border border-rose-200/90 shadow-sm space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-[#DC7898] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                              <Navigation className="w-3.5 h-3.5" />
                            </span>
                            <strong className="text-stone-800 font-semibold text-xs sm:text-sm">
                              {editingAddressId ? 'Editar Endereço Salvo' : 'Cadastrar Novo Endereço'}
                            </strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingAddress(false);
                              setEditingAddressId(null);
                            }}
                            className="text-stone-400 hover:text-stone-700 text-xs p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Tipo de Endereço (Identificador) */}
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                            Identificação do Endereço *
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'Casa', icon: <Home className="w-3 h-3" /> },
                              { label: 'Trabalho', icon: <Briefcase className="w-3 h-3" /> },
                              { label: 'Apartamento', icon: <MapPin className="w-3 h-3" /> },
                              { label: 'Principal', icon: <Star className="w-3 h-3" /> }
                            ].map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => setAddrForm((prev) => ({ ...prev, label: item.label }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                  addrForm.label === item.label
                                    ? 'bg-[#DC7898] text-white border-[#DC7898] shadow-xs'
                                    : 'bg-white text-stone-600 border-rose-100 hover:border-rose-300'
                                }`}
                              >
                                {item.icon}
                                <span>{item.label}</span>
                              </button>
                            ))}
                            <input
                              type="text"
                              placeholder="Outro (Ex: Praia)"
                              value={['Casa', 'Trabalho', 'Apartamento', 'Principal'].includes(addrForm.label) ? '' : addrForm.label}
                              onChange={(e) => setAddrForm((prev) => ({ ...prev, label: e.target.value }))}
                              className="bg-white border border-rose-100 rounded-xl px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898] w-28 sm:w-36"
                            />
                          </div>
                        </div>

                        {/* Grid CEP + Rua */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                              CEP * {isSearchingCep && <span className="text-[#DC7898] font-normal text-[10px] animate-pulse">(Buscando...)</span>}
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="00000-000"
                                maxLength={9}
                                value={addrForm.cep}
                                onChange={(e) => handleAddrCepChange(e.target.value)}
                                className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898]"
                                required
                              />
                              {addrForm.cep.replace(/\D/g, '').length === 8 && !isSearchingCep && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
                              )}
                            </div>
                            <span className="text-[10px] text-stone-400 block mt-0.5">Preenchimento automático</span>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                              Rua / Logradouro *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Alameda dos Flamingos"
                              value={addrForm.street}
                              onChange={(e) => setAddrForm((prev) => ({ ...prev, street: e.target.value }))}
                              className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898]"
                              required
                            />
                          </div>
                        </div>

                        {/* Grid Número + Complemento + Bairro */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                              Número *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: 1420"
                              value={addrForm.number}
                              onChange={(e) => setAddrForm((prev) => ({ ...prev, number: e.target.value }))}
                              className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898]"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                              Complemento (opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Apto 82 Bloco B"
                              value={addrForm.complement}
                              onChange={(e) => setAddrForm((prev) => ({ ...prev, complement: e.target.value }))}
                              className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898]"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                              Bairro *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Jardins"
                              value={addrForm.neighborhood}
                              onChange={(e) => setAddrForm((prev) => ({ ...prev, neighborhood: e.target.value }))}
                              className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898]"
                              required
                            />
                          </div>
                        </div>

                        {/* Grid Cidade + UF + Checkbox Principal */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                              Cidade *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: São Paulo"
                              value={addrForm.city}
                              onChange={(e) => setAddrForm((prev) => ({ ...prev, city: e.target.value }))}
                              className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898]"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                              Estado (UF) *
                            </label>
                            <input
                              type="text"
                              placeholder="SP"
                              maxLength={2}
                              value={addrForm.state}
                              onChange={(e) => setAddrForm((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))}
                              className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-xs text-stone-800 uppercase placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898]"
                              required
                            />
                          </div>
                        </div>

                        {/* Checkbox: Definir como principal */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="checkIsPrimary"
                            checked={addrForm.isPrimary}
                            onChange={(e) => setAddrForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                            className="rounded text-[#DC7898] focus:ring-[#DC7898] w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="checkIsPrimary" className="text-xs text-stone-700 cursor-pointer font-medium select-none">
                            Definir como meu endereço principal de entrega
                          </label>
                        </div>

                        {/* Card de Preview ao Vivo do Endereço */}
                        {addrForm.street && (
                          <div className="p-3 rounded-xl bg-white border border-rose-200/80 shadow-2xs space-y-1">
                            <span className="text-[9px] font-bold text-[#DC7898] uppercase tracking-wider block">
                              Preview do Endereço no Perfil e Checkout:
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#DC7898] text-[10px] font-bold">
                                {addrForm.label}
                              </span>
                              {addrForm.isPrimary && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                  ★ Principal
                                </span>
                              )}
                              <span>{addrForm.street}, {addrForm.number || 'S/N'} {addrForm.complement ? `· ${addrForm.complement}` : ''}</span>
                            </div>
                            <p className="text-[11px] text-stone-500 font-light">
                              {addrForm.neighborhood} · {addrForm.city}/{addrForm.state} · CEP {addrForm.cep}
                            </p>
                          </div>
                        )}

                        {/* Botões de Ação */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-100">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingAddress(false);
                              setEditingAddressId(null);
                            }}
                            className="px-4 py-2 rounded-full border border-stone-200 hover:border-stone-300 text-stone-600 text-xs font-semibold transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={addressLoading}
                            className="px-5 py-2 rounded-full bg-[#DC7898] hover:bg-[#C65677] text-white text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                          >
                            {addressLoading && <span className="animate-spin text-xs">●</span>}
                            <span>{editingAddressId ? 'Atualizar Endereço' : 'Salvar Endereço'}</span>
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {/* LISTAGEM DE ENDEREÇOS SALVOS */}
                    {(customerUser.addresses && customerUser.addresses.length > 0) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {customerUser.addresses.map((addr: any, idx: number) => {
                          const isPrimary = Boolean(addr.isPrimary || idx === 0 && !customerUser.addresses?.some((a: any) => a.isPrimary));
                          return (
                            <div
                              key={addr.id || idx}
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                                isPrimary
                                  ? 'bg-rose-50/40 border-rose-300 shadow-2xs'
                                  : 'bg-stone-50/60 border-stone-200 hover:border-rose-200'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 pb-2 border-b border-rose-100/70">
                                  <div className="flex items-center gap-1.5">
                                    <span className="p-1 rounded-lg bg-white border border-rose-100 text-[#DC7898]">
                                      {addr.label === 'Trabalho' ? (
                                        <Briefcase className="w-3.5 h-3.5" />
                                      ) : addr.label === 'Apartamento' ? (
                                        <MapPin className="w-3.5 h-3.5" />
                                      ) : (
                                        <Home className="w-3.5 h-3.5" />
                                      )}
                                    </span>
                                    <strong className="text-stone-800 font-semibold text-xs">{addr.label || 'Endereço'}</strong>
                                  </div>

                                  {isPrimary ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                      <Check className="w-3 h-3" />
                                      <span>Principal</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSetPrimaryAddress(addr.id)}
                                      className="text-[10px] text-stone-500 hover:text-[#DC7898] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Definir como endereço principal"
                                    >
                                      <Star className="w-3 h-3" />
                                      <span>Tornar Principal</span>
                                    </button>
                                  )}
                                </div>

                                <div className="mt-2 text-stone-700 text-xs space-y-0.5">
                                  <p className="font-medium text-stone-800">
                                    {addr.street}, {addr.number} {addr.complement ? `· ${addr.complement}` : ''}
                                  </p>
                                  <p className="text-stone-500 text-[11px]">
                                    {addr.neighborhood} · {addr.city}/{addr.state}
                                  </p>
                                  <p className="text-stone-400 font-mono text-[10px]">
                                    CEP: {formatCEP(addr.cep)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60">
                                <button
                                  type="button"
                                  onClick={() => handleEditAddress(addr)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-stone-600 hover:text-stone-900 bg-white border border-stone-200 text-[11px] font-medium transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 text-[11px] font-medium transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remover</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-rose-50/30 border border-dashed border-rose-200 text-center space-y-2">
                        <MapPin className="w-7 h-7 text-[#DC7898]/60 mx-auto" />
                        <p className="text-xs font-semibold text-stone-700">
                          Nenhum endereço cadastrado ainda.
                        </p>
                        <p className="text-[11px] text-stone-500 font-light max-w-sm mx-auto">
                          Adicione seu endereço para finalizar suas compras na boutique com 1 clique, sem precisar redigitar dados a cada pedido.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddAddress}
                          className="px-4 py-2 rounded-full bg-[#DC7898] hover:bg-[#C65677] text-white text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Cadastrar Meu Primeiro Endereço</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SEÇÃO: ALTERAR SENHA (Opcional e discreta) */}
                  <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-stone-400" />
                        <span>Segurança da Conta & Alteração de Senha</span>
                      </span>
                      {showPasswordSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showPasswordSection && (
                      <form onSubmit={handleSaveProfile} className="pt-3 border-t border-rose-100 space-y-3 animate-fade-in">
                        {editSuccessMsg && (
                          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{editSuccessMsg}</span>
                          </div>
                        )}
                        {editErrorMsg && (
                          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 flex items-center gap-1.5">
                            <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{editErrorMsg}</span>
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-stone-700 block mb-1">Senha Atual</label>
                            <input
                              type="password"
                              placeholder="Digite sua senha atual"
                              value={editCurrentPass}
                              onChange={(e) => setEditCurrentPass(e.target.value)}
                              className="w-full bg-stone-50 border border-rose-100 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-stone-700 block mb-1">Nova Senha</label>
                            <input
                              type="password"
                              placeholder="Mínimo 8 caracteres"
                              value={editNewPass}
                              onChange={(e) => setEditNewPass(e.target.value)}
                              className="w-full bg-stone-50 border border-rose-100 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#DC7898]/40 focus:border-[#DC7898]"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={editLoading || !editNewPass.trim()}
                            className="px-4 py-2 rounded-full bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {editLoading ? 'Atualizando...' : 'Atualizar Senha'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
    </ModalShell>
  );
};
