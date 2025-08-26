// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);

      // Buscar datos en profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, role')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    };

    getUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
if (!profile) return <LoadingSpinner />;

return (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <Card className="w-screen max-w-md">
      <CardBody>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold mb-4">Bienvenido 👋</h1>
          <p>
            <strong>Nombre:</strong> {profile.full_name}
          </p>
          <p>
            <strong>Usuario:</strong> {profile.username}
          </p>
          <p>
            <strong>Correo:</strong> {user?.email}
          </p>
          <p>
            <strong>Rol:</strong> {profile.role}
          </p>
        </div>

        <Link to="/perfil">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4">
            Configuración ⚙️
          </button>
        </Link>
        <Button className="mt-6" color="danger" onPress={handleLogout}>
          Cerrar sesión
        </Button>
      </CardBody>
    </Card>
  </div>
);
}