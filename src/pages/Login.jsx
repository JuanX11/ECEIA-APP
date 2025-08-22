// src/pages/Login.jsx
import { useState } from 'react';
import { Input, Button, Card, CardBody, Link } from '@heroui/react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <Card className="w-full max-w-sm shadow-md">
        <CardBody>
          <h1 className="text-xl font-bold mb-4 text-center">Iniciar sesión</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isRequired
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isRequired
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" color="primary" fullWidth>
              Ingresar
            </Button>
          </form>
          <p className="text-sm text-center mt-4">
            ¿No tienes cuenta? <Link href="/register">Regístrate</Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
