import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { setCredentials } from '../store/authSlice';
import { apiClient } from '../../../common/utils/apiClient';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await apiClient('/admin/login', {
        data: { email, password },
        method: 'POST'
      });

      dispatch(setCredentials({
        token: data.accessToken,
        adminId: data.admin._id,
        email: data.admin.email,
        name: data.admin.name,
        role: data.admin.role,
      }));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleLogin}>
      {error && (
        <div className="bg-red-50 text-woosh-error p-3 rounded-lg text-sm text-center border border-red-200">
          {error}
        </div>
      )}

      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<Mail size={18} />}
        placeholder="admin@woosh.com"
        required
      />

      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<Lock size={18} />}
        placeholder="••••••••"
        required
        suffix={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-0.5 hover:bg-slate-100 rounded transition-colors text-woosh-placeholder hover:text-woosh-dark focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded border-woosh-border text-woosh-primary focus:ring-woosh-primary/50" />
          <span className="text-woosh-text">Remember me</span>
        </label>
        <button type="button" className="text-woosh-primary font-medium hover:underline text-sm">
          Forgot password?
        </button>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Sign In
      </Button>
    </form>
  );
}
