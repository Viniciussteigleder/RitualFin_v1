'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, useSupabaseClient } from '@/lib/supabase/provider';

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
        <h1>Entrar no RitualFin</h1>
        <p className="muted">Use Google ou email + senha (Supabase Auth).</p>
        <form onSubmit={handleSignIn} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processando...' : 'Entrar'}
          </button>
        </form>
        <button type="button" className="secondary" onClick={handleSignUp} disabled={isSubmitting}>
          Criar conta com este email
        </button>
        <div className="divider">ou</div>
        <button type="button" className="google" onClick={handleGoogleSignIn} disabled={isSubmitting}>
          Continuar com Google
        </button>
        {devShortcutAvailable && (
          <button type="button" className="secondary" onClick={() => (window.location.href = '/dev/autologin')}>
            Autologin (dev)
          </button>
        )}
        {error && <p className="text-error">{error}</p>}
        {message && <p className="text-success">{message}</p>}
      </div>
    </div>
  );
}
