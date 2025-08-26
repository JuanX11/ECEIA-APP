import LoadingSpinner from "../components/LoadingSpinner";
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Miembros() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return navigate('/login');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) setProfile(data);
      setLoading(false);
    };
    init();
  }, [navigate]);

  if (loading) return <LoadingSpinner />;
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Registro de Asistencia</h1>
      <p className="mt-2 text-gray-600">
        Aquí podrás marcar la asistencia de los miembros.
      </p>
    </div>
  );
}
