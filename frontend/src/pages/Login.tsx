import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/common/Input';
import { BorderGlow } from '../components/common/BorderGlow';
import { BrandLogo } from '../components/common/BrandLogo';
import { TiltCard } from '../components/TiltCard';
import { MagneticButton } from '../components/MagneticButton';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('ahmed@novatraders.pk');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, demoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await login({ email, password });
      success('Welcome back to your business dashboard!', 'Login Successful');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Failed to login. Please check your credentials.';
      setErrorMsg(msg);
      error(msg, 'Authentication Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setErrorMsg('');
    setIsDemoLoading(true);

    try {
      await demoLogin();
      success('Signed in to Nova Traders sample business!', 'Demo Account Activated');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Failed to connect to demo account.';
      setErrorMsg(msg);
      error(msg, 'Demo Login Failed');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Editorial Showcase */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 rounded-2xl bg-surface-raised text-ink border border-border shadow-soft min-h-[560px]">
          {/* Top Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />
              <div>
                <span className="font-heading font-bold text-lg text-ink tracking-tight block leading-tight">
                  Nova Business OS
                </span>
                <span className="text-[11px] font-mono text-accent font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Live Financial Platform
                </span>
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-2xl font-heading font-bold text-ink tracking-tight leading-snug">
                Precision Invoicing, P&L Ledger & Cost Telemetry
              </h2>
              <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                Empowering modern businesses with real-time gross margin analytics, automated stock decrement, and multi-tenant ledger security.
              </p>
            </div>
          </div>

          {/* Financial Preview Card with Subtle 3D Tilt */}
          <TiltCard maxTilt={4} className="my-6 p-4 rounded-xl bg-surface border border-border space-y-3 shadow-lift">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
              <span className="text-secondary font-mono flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-accent" />
                Live Terminal Snapshot
              </span>
              <span className="px-2 py-0.5 rounded-full bg-accent-muted text-accent font-bold text-[10px] font-mono">
                +18.5% Net Profit
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                <span className="text-[10px] text-muted uppercase font-semibold">Monthly Income</span>
                <div className="text-sm font-mono font-bold text-success mt-0.5 tabular-nums">Rs 485,000</div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                <span className="text-[10px] text-muted uppercase font-semibold">Tracked Costs</span>
                <div className="text-sm font-mono font-bold text-danger mt-0.5 tabular-nums">Rs 142,500</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-secondary">
              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
              <span>Auto-sync POS billing with inventory decrement</span>
            </div>
          </TiltCard>
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          {/* Mobile brand logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex justify-center mb-3">
              <BrandLogo size="lg" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-ink tracking-tight">
              Nova Business OS
            </h1>
            <p className="text-xs text-secondary mt-1">
              Financial Management & Point-of-Sale
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
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-heading font-bold text-ink tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Sign in to access your business ledger & reports
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-lg bg-danger/10 text-danger text-xs font-medium border border-danger/20 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Business Email"
                  type="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted hover:text-ink transition-colors focus:outline-none cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <MagneticButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white shadow-glow rounded-xl transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <span>Signing In...</span>
                  ) : (
                    <>
                      <span>Sign In to Terminal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </MagneticButton>
              </form>

              {/* 1-Click Demo Login Button */}
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  disabled={isDemoLoading || isLoading}
                  className="w-full py-2.5 px-4 rounded-lg border border-accent/20 bg-accent-muted hover:bg-accent-muted/80 text-accent font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>1-Click Test Drive (Demo Account)</span>
                </button>
              </div>

              {/* Registration Link */}
              <div className="text-center text-xs text-muted pt-1">
                New business?{' '}
                <Link to="/register" className="text-accent font-bold hover:underline">
                  Create an account
                </Link>
              </div>
            </div>
          </BorderGlow>

          {/* Security guarantee footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>256-bit isolated multi-tenant encrypted ledger</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
