import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import AdminView from '../components/AdminView';
import MemberView from '../components/MemberView';

export default function Reuniones() {
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

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="min-h-screen p-4">
      {profile.role === 'Admin' ? (
        <AdminView profile={profile} />
      ) : (
        <MemberView profile={profile} />
      )}
    </div>
  );
}
