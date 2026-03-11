import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Receipt,
  RefreshCcw,
  User,
  UserPlus,
  Users,
} from 'lucide-react-native';

const icons = {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Receipt,
  RefreshCcw,
  User,
  UserPlus,
  Users,
};

export default function AppIcon({ name, size = 20, color, strokeWidth = 1.5, ...props }) {
  const Icon = icons[name];

  if (!Icon) return null;

  return <Icon size={size} color={color} strokeWidth={strokeWidth} {...props} />;
}
