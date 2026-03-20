import React, { useState } from 'react';
import api, { setAuthToken } from '../api';

interface UserLoginProps {
  onUserLogin: () => void;
  onToggleAdmin: () => void;
}

const UserLogin: React.FC<UserLoginProps> = ({ onUserLogin, onToggleAdmin }) => {
  const [mode, setMode] = useState<"menu" | "register" | "login">("menu");

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ================= REGISTER =================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name || !surname || !email || !password) {
      setError("Tous les champs sont obligatoires");
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.auth.register(name, surname, email, password);
      console.log('🔍 User register response:', JSON.stringify(data));
      const token = data?.token || data?.session_token;
      if (token) {
        setAuthToken(token);
        console.log('✅ User token saved after registration');
      }
      onUserLogin();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  // ================= LOGIN =================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginEmail || !password) {
      setError("Email et mot de passe obligatoires");
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.auth.login(loginEmail, password);
      console.log('🔍 User login response:', JSON.stringify(data));
      const token = data?.token || data?.session_token;
      if (token) {
        setAuthToken(token);
        console.log('✅ User token saved after login');
      }
      onUserLogin();
    } catch (err: any) {
      setError(err?.message || "Email ou mot de passe incorrect");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* Left Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo display (hidden on lg screens) */}
          <div className="mb-10 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="lg:hidden bg-gray-900/5 p-4 rounded-2xl mb-4 inline-block">
              <img
                src="/assets/logo.png"
                alt="E-VENTS Logo"
                className="h-20 object-contain drop-shadow-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<span class="text-4xl font-extrabold text-blue-600 tracking-widest font-heading">E-VENTS</span>';
                }}
              />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold font-heading text-gray-900 tracking-tight mb-2">E-VENTS</h1>
            <p className="text-gray-500">Gérez vos billets et participez aux meilleurs événements.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md">
              {error}
            </div>
          )}

          {/* ================= MENU ================= */}
          {mode === "menu" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-8 text-gray-900 text-center lg:text-left">
                Bienvenue !
              </h2>

              <button
                onClick={() => setMode("login")}
                className="w-full bg-gray-900 text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Se connecter
              </button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">Ou</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                onClick={onUserLogin}
                className="w-full bg-blue-500/10 text-blue-700 py-3.5 px-4 rounded-xl font-semibold hover:bg-blue-500/20 transition-all border border-blue-200"
              >
                Continuer sans se connecter
              </button>

              <div className="pt-4 text-center">
                <button
                  onClick={onToggleAdmin}
                  className="text-sm font-medium text-gray-400 hover:text-blue-600 transition-colors"
                >
                  Accès Administration
                </button>
              </div>
            </div>
          )}

          {/* ================= REGISTER ================= */}
          {mode === "register" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-8 text-gray-900">Créer un compte</h2>

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mt-2"
                >
                  {isLoading ? 'Création en cours...' : 'Créer mon compte'}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-600">
                Déjà un compte ?{' '}
                <button
                  onClick={() => { setMode("login"); setError(''); }}
                  className="font-semibold text-blue-600 hover:text-blue-500"
                >
                  Se connecter
                </button>
              </p>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <button
                  onClick={onToggleAdmin}
                  className="text-sm font-medium text-gray-400 hover:text-blue-600 transition-colors"
                >
                  Accès Administration
                </button>
              </div>
            </div>
          )}

          {/* ================= LOGIN ================= */}
          {mode === "login" && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-2xl font-bold mb-8 text-gray-900">Connexion</h2>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Se souvenir de moi
                    </label>
                  </div>
                  <div className="text-sm">
                    <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
                      Mot de passe oublié ?
                    </a>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-900 text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mt-4"
                >
                  {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <button
                  onClick={() => { setMode("register"); setError(''); }}
                  className="font-semibold text-blue-600 hover:text-blue-500"
                >
                  S'inscrire
                </button>
              </p>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <button
                  onClick={onToggleAdmin}
                  className="text-sm font-medium text-gray-400 hover:text-blue-600 transition-colors"
                >
                  Accès Administration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Image & Logo */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/20 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"
          alt="Concert Crowd"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />

        <div className="relative z-20 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-1000">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl mb-8">
            <img
              src="/assets/logo.png"
              alt="E-VENTS Logo"
              className="h-32 object-contain drop-shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<span class="text-4xl font-extrabold text-white tracking-widest font-heading">E-VENTS</span>';
              }}
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 font-heading">L'expérience avant tout.</h2>
          <p className="text-gray-300 text-lg max-w-md">Découvrez des événements inoubliables créés par des organisateurs passionnés.</p>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
