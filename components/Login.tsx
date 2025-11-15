import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { login } from '../services/apiService';
import Icon from './common/Icon';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  isSsoEnabled: boolean;
}

const developerPhoto = `data:image/jpeg;base64,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`;

const Login: React.FC<LoginProps> = ({ onLoginSuccess, isSsoEnabled }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const user = await login({ username, password });
      onLoginSuccess(user);
    } catch (err: any) {
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão com a internet e se a API está em execução.');
      } else {
        setError(err.message || 'Usuário ou senha inválidos.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSsoLogin = () => {
    // Redirect to the backend which will construct the SAML request and redirect to the IdP
    window.location.href = `http://${window.location.hostname}:3001/api/sso/login`;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg p-4">
      <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-lg w-full max-w-sm">
        <div className="text-center mb-8">
            <Icon name="ShieldCheck" size={48} className="mx-auto text-brand-primary mb-2" />
          <h1 className="text-3xl font-bold text-brand-dark dark:text-dark-text-primary">Inventário Pro</h1>
          <p className="text-gray-500 dark:text-dark-text-secondary mt-1">Faça login para continuar</p>
        </div>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-dark-text-secondary text-sm font-bold mb-2" htmlFor="username">
              Usuário
            </label>
            <input
              id="username"
              data-testid="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border dark:border-dark-border rounded w-full py-2 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-dark-text-primary leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ex: admin"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-dark-text-secondary text-sm font-bold mb-2" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              data-testid="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border dark:border-dark-border rounded w-full py-2 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-dark-text-primary mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="********"
            />
          </div>
          <div className="flex flex-col items-center justify-between gap-4">
            <button
              type="submit"
              data-testid="login-button"
              disabled={isLoading}
              className="bg-brand-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
            {isSsoEnabled && (
                <>
                    <div className="relative w-full my-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-dark-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-dark-card text-gray-500 dark:text-dark-text-secondary">ou</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSsoLogin}
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-dark-text-primary font-semibold py-2 px-4 border border-gray-300 dark:border-dark-border rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 w-full flex items-center justify-center gap-2"
                    >
                        <Icon name="KeyRound" size={18}/> Entrar com SSO
                    </button>
                </>
            )}
          </div>
        </form>
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 text-xs">
        <img
          src={developerPhoto}
          alt="Foto do Desenvolvedor"
          className="w-8 h-8 rounded-full object-cover border-2 border-gray-300 dark:border-dark-border"
        />
        <div className="text-left text-gray-500 dark:text-dark-text-secondary">
          <p className="font-semibold">MRR INFORMATICA</p>
          <p className="text-gray-400 dark:text-gray-500">&copy; 2025 Dev: Marcelo Reis</p>
        </div>
      </div>
    </div>
  );
};

export default Login;