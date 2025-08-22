// src/pages/Register.jsx
import { useState } from 'react';
import {
  Input,
  Button,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);

      // Crear usuario en auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
            role: 'miembro',
          },
        },
      });

      if (signUpError) throw signUpError;
      const user = data.user;

      // Guardar en tabla profiles
      if (user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: user.id,
            full_name: formData.fullName,
            username: formData.username,
            role: 'miembro',
          },
        ]);
        if (profileError) throw profileError;
      }

      // Mostrar modal de éxito
      setModalOpen(true);
      setTimeout(() => {
        setModalOpen(false);
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardBody>
          <h1 className="text-2xl font-bold mb-6 text-center">Crear cuenta</h1>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input
              name="fullName"
              label="Nombre Completo"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <Input
              name="username"
              label="Usuario"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <Input
              name="email"
              label="Correo"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              name="password"
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              name="confirmPassword"
              label="Confirmar Contraseña"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" color="primary" isLoading={loading}>
              Registrarse
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Modal de éxito */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalContent>
          <ModalHeader>¡Registro exitoso! 🎉</ModalHeader>
          <ModalBody>
            <p>Ahora puedes iniciar sesión.</p>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
