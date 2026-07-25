import { ArrowDownLeft, ArrowUpRight, BusFront, Grid2X2, Landmark, Plus, QrCode, ReceiptText, Send, Smartphone } from 'lucide-react';
export const user = { name: 'Emiliano', initials: 'EA', balance: 10000, monthlyReturn: 245.30, riskProfile: 'Moderado' };
export const quickActions = [
  { id: 'send', title: 'Enviar', icon: Send }, { id: 'receive', title: 'Recibir', icon: ArrowDownLeft },
  { id: 'qr', title: 'Pagar QR', icon: QrCode }, { id: 'deposit', title: 'Ingresar', icon: Plus },
];
export const services = [
  { id: 'phone', title: 'Recargar celular', icon: Smartphone }, { id: 'bills', title: 'Pagar servicios', icon: ReceiptText },
  { id: 'transport', title: 'Transporte', icon: BusFront }, { id: 'more', title: 'Ver más', icon: Grid2X2 },
];
export const transactions = [
  { id: '1', title: 'Ingreso de dinero', detail: 'Hoy, 10:42', amount: 5000, icon: ArrowDownLeft, tone: 'positive' },
  { id: '2', title: 'Compra ETF', detail: 'Ayer, 16:18', amount: -1200, icon: Landmark, tone: 'neutral' },
  { id: '3', title: 'Transferencia enviada', detail: '22 Jul, 09:30', amount: -850, icon: ArrowUpRight, tone: 'neutral' },
];
