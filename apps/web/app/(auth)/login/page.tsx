'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, useSupabaseClient } from '@/lib/supabase/provider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const session = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const devShortcutAvailable = useMemo(() => {
    return (
      process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'
    );
  }, []);

  useEffect(() => {
    if (session) {
      router.push('/painel');
    }
  }, [router, session]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Login realizado! Redirecionando...');
    }

    setIsSubmitting(false);
  };

  const handleSignUp = async () => {
    setIsSubmitting(true);
    setError('');
    setMessage('');

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          locale: 'pt-BR',
          currency: 'EUR'
        }
      }
    });

    if (error) {
      setError(error.message);
    } else if (data?.user) {
      setMessage('Conta criada! Verifique o email e confirme o link enviado.');
    }

    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError('');
    setMessage('');

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'email'
      }
    });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="rf-logo">R</div>
        <div>
          <p className="rf-sidebar-title">RitualFin</p>
          <h1>Acesse sua conta</h1>
          <p className="muted">Gerencie suas finanças com clareza.</p>
        </div>
        <form onSubmit={handleSignIn} className="login-form">
          <label>
            Email
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            <div className="login-password-header">
              <span>Senha</span>
              <a href="#" className="muted" onClick={(event) => event.preventDefault()}>
                Esqueceu?
              </a>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processando...' : 'Entrar'}
          </Button>
        </form>
        <Button variant="secondary" onClick={handleGoogleSignIn} disabled={isSubmitting}>
          Continuar com Google
        </Button>
        <div className="login-divider">ou</div>
        <Button variant="ghost" onClick={handleSignUp} disabled={isSubmitting}>
          Cadastre-se
        </Button>
        {devShortcutAvailable && (
          <Button variant="secondary" onClick={() => (window.location.href = '/dev/autologin')}>
            Autologin (dev)
          </Button>
        )}
        {error && <p className="text-error">{error}</p>}
        {message && <p className="text-success">{message}</p>}
      </div>
    </div>
  );
}
