import React from 'react';
import { useAction } from '../hooks/useAction';
import { RenderInput } from './VisualComponents';

interface AuthScreenProps {
  type: 'login' | 'signup';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ type }) => {
  const { handleAction } = useAction();

  const isLogin = type === 'login';

  const handleSubmit = () => {
    if (isLogin) {
      handleAction({
        type: 'auth:login',
        fields: { email: 'auth_email', password: 'auth_password' },
        onError: {
          type: 'popup',
          title: 'Erro de Login',
          message: 'Email ou senha inválidos.',
        },
      });
    } else {
      handleAction({
        type: 'auth:signup',
        fields: { email: 'auth_email', password: 'auth_password' },
        onError: {
          type: 'popup',
          title: 'Erro de Cadastro',
          message: 'Este email já está em uso.',
        },
      });
    }
  };

  const switchScreen = () => {
    handleAction({
        type: 'navigate',
        target: isLogin ? 'auth:signup' : 'auth:login',
    })
  }

  return (
    <div className="p-6 flex flex-col justify-center h-full">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        {isLogin ? 'Login' : 'Criar Conta'}
      </h2>

      <div className="space-y-4">
        <RenderInput component={{
            id: 'auth_email',
            type: 'input',
            label: 'Email',
            inputType: 'email',
            placeholder: 'seu@email.com'
        }} />
         <RenderInput component={{
            id: 'auth_password',
            type: 'input',
            label: 'Senha',
            inputType: 'password',
            placeholder: '••••••••'
        }} />
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 w-full px-4 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
      >
        {isLogin ? 'Entrar' : 'Cadastrar'}
      </button>

      <div className="mt-4 text-center">
        <button onClick={switchScreen} className="text-sm text-blue-600 hover:underline">
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
        </button>
      </div>
    </div>
  );
};