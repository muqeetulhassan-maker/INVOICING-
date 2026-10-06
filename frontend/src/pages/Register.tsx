import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  DollarSign,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/common/Input';
import { BorderGlow } from '../components/common/BorderGlow';
import { BrandLogo } from '../components/common/BrandLogo';
import { TiltCard } from '../components/TiltCard';
import { MagneticButton } from '../components/MagneticButton';
import { isValidPhoneNumber, PHONE_ERROR_MESSAGE } from '../utils/validators';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-muted/30' };
    if (pass.length < 6) return { score: 1, label: 'Weak (min 6 chars)', color: 'bg-rose-500' };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
    }
    return { score: 2, label: 'Good', color: 'bg-amber-500' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      setErrorMsg(PHONE_ERROR_MESSAGE);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        businessName: formData.businessName,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
      });

      success('Your business workspace is ready!', 'Account Created');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Failed to register business account.';
      setErrorMsg(msg);
      error(msg, 'Registration Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Onboarding Benefits Showcase with TiltCard */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between">
          <TiltCard maxTilt={6} className="h-full">
            <div className="p-8 rounded-2xl bg-surface-raised text-ink border border-border shadow-lift min-h-[600px] flex flex-col justify-between">
              {/* Top Branding */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <BrandLogo size="md" />
                  <div>
                    <span className="font-heading font-bold text-lg text-ink tracking-tight block leading-tight">
                      Nova Business OS
                    </span>
                    <span className="text-[11px] font-mono text-accent font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      Instant Workspace Provisioning
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <h2 className="text-2xl font-heading font-bold text-ink tracking-tight leading-snug">
                    Everything You Need to Run Your Business
                  </h2>
                  <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                    Join retail shops, distributors, and traders automating sales, expenses, and invoices.
                  </p>
                </div>
              </div>

              {/* Feature List */}
              <div className="my-6 space-y-3.5">
                {[
                  {
                    icon: DollarSign,
                    title: 'Automated Net Profit Engine',
                    desc: 'Real-time calculation of revenue minus costs with zero manual spreadsheets.',
                  },
                  {
                    icon: Sparkles,
                    title: 'AI Receipt Scanner',
                    desc: 'Upload paper receipts and let Gemini Vision extract dates, vendors, and amounts.',
                  },
                  {
                    icon: Package,
                    title: 'Instant Inventory Auto-Decrement',
                    desc: 'Live stock tracking with low-threshold warning alerts.',
                  },
                ].map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-surface border border-border flex items-start gap-3 transition-colors hover:bg-surface-raised"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent-muted text-accent flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink font-heading">{feat.title}</h4>
                        <p className="text-[11px] text-muted mt-0.5 leading-snug">{feat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Trust Badge */}
              <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-secondary">
                <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
                <span>Multi-tenant data isolation. No credit card required.</span>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* Right Side: Registration Form */}
        <div className="lg:col-span-7 w-full max-w-xl mx-auto">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex justify-center mb-3">
              <BrandLogo size="lg" />
            </div>
            <h1 className="text-2xl font-heading font-extrabold text-ink tracking-tight">
              Register Your Business
            </h1>
            <p className="text-xs text-secondary mt-1">
              Start managing sales, inventory, expenses, and profits in one place.
            </p>
          </div>

          <BorderGlow
            backgroundColor="var(--color-surface, #111114)"
            borderRadius={16}
            glowColor="252 100% 68%"
            glowIntensity={0.65}
            glowRadius={28}
            colors={['#7C5CFF', '#9B82FF', '#34D399', '#60A5FA']}
            className="shadow-soft"
          >
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <h2 className="text-xl font-heading font-extrabold text-ink tracking-tight">
                  Create Business Account
                </h2>
                <p className="text-xs text-secondary mt-0.5">
                  Set up your business workspace in under 60 seconds
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-danger/10 text-danger text-xs font-medium border border-danger/20 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Business Name"
                    name="businessName"
                    placeholder="e.g. Apex Electronics"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                    leftIcon={<Building2 className="w-4 h-4 icon-interactive" />}
                  />

                  <Input
                    label="Owner Full Name"
                    name="fullName"
                    placeholder="e.g. Tariq Mehmood"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    leftIcon={<User className="w-4 h-4 icon-interactive" />}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Business Email"
                    name="email"
                    type="email"
                    placeholder="info@business.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    leftIcon={<Mail className="w-4 h-4 icon-interactive" />}
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    placeholder="0300-1234567"
                    value={formData.phone}
                    onChange={handleChange}
                    leftIcon={<Phone className="w-4 h-4 icon-interactive" />}
                  />
                </div>

                <Input
                  label="Business Address (Optional)"
                  name="address"
                  placeholder="e.g. Shop # 14, Main Market, Lahore"
                  value={formData.address}
                  onChange={handleChange}
                  leftIcon={<MapPin className="w-4 h-4 icon-interactive" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      leftIcon={<Lock className="w-4 h-4 icon-interactive" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted hover:text-ink transition-colors focus:outline-none cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                    {formData.password && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted">
                        <div className="flex-1 h-1 bg-surface-raised rounded-full overflow-hidden border border-border">
                          <div
                            className={`h-full ${strength.color} transition-all duration-300`}
                            style={{ width: `${(strength.score / 3) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold font-mono">{strength.label}</span>
                      </div>
                    )}
                  </div>

                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    leftIcon={<Lock className="w-4 h-4 icon-interactive" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-muted hover:text-ink transition-colors focus:outline-none cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>

                <div className="pt-2">
                  <MagneticButton
                    strength={16}
                    disabled={isLoading}
                    className="w-full h-11 text-sm font-semibold rounded-xl bg-accent hover:bg-accent-hover text-white shadow-glow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Creating Workspace...' : 'Create Business Account'}</span>
                    <ArrowRight className="w-4 h-4 icon-interactive" />
                  </MagneticButton>
                </div>
              </form>

              <div className="text-center text-xs text-secondary pt-3 border-t border-border">
                Already registered?{' '}
                <Link to="/login" className="text-accent font-bold hover:underline">
                  Sign In to Terminal
                </Link>
              </div>
            </div>
          </BorderGlow>
        </div>
      </div>
    </div>
  );
};

export default Register;

