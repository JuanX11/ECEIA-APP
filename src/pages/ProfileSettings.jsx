// src/pages/ProfileSettings.jsx
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Input, Avatar, Spinner } from '@heroui/react';
import {
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'; // Importa nuevos iconos

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const getUserProfile = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, role, avatar_url')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || '');
      }
      setLoading(false);
    };

    getUserProfile();
  }, [navigate]);

  const handleAvatarClick = () => {
    if (editing) fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    // Previsualización inmediata
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    let finalAvatarUrl = avatarUrl;

    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) {
        alert('Error subiendo avatar');
        setLoading(false);
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      finalAvatarUrl = data.publicUrl;
      setAvatarUrl(finalAvatarUrl);
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        username: username,
        avatar_url: finalAvatarUrl,
      })
      .eq('id', user.id);

    if (error) {
      alert('Error al actualizar perfil');
    } else {
      setProfile({
        ...profile,
        full_name: fullName,
        username: username,
        avatar_url: finalAvatarUrl,
      });
      setEditing(false);
      setSelectedFile(null);
      alert('Perfil actualizado ✅');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setSelectedFile(null);
    setFullName(profile.full_name || '');
    setUsername(profile.username || '');
    setAvatarUrl(profile.avatar_url || '');
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg shadow-xl">
        {/* Encabezado y botón de edición */}
        <div className="relative p-6 pb-0">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <Avatar
                src={avatarUrl || undefined}
                className={`w-32 h-32 md:w-40 md:h-40 cursor-pointer transition-all duration-300 ${
                  editing ? 'scale-105' : ''
                }`}
                onClick={handleAvatarClick}
              />
              {editing && (
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 hover:opacity-100">
                  <PencilSquareIcon className="h-10 w-10 text-white" />
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAvatarChange}
            />
            <h1 className="text-xl md:text-2xl font-bold mt-4 text-center">
              {profile.full_name || 'Sin nombre'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>
          <p className="text-gray-500 text-sm mt-4 text-center border-t pt-4">
            Rol:{' '}
            <span className="font-semibold text-gray-700">{profile.role}</span>
          </p>
        </div>
        <CardBody className="flex flex-col gap-4 p-6 pt-4">
          <div className="flex flex-col gap-4 mt-2">
            <Input
              label="Nombre completo"
              value={fullName}
              disabled={!editing}
              onChange={(e) => setFullName(e.target.value)}
              variant="flat"
              className="w-full"
            />
            <Input
              label="Usuario"
              value={username}
              disabled={!editing}
              onChange={(e) => setUsername(e.target.value)}
              variant="flat"
              className="w-full"
            />
          </div>

          <div className="flex gap-2 justify-end mt-4">
            {!editing ? (
              <Button
                color="primary"
                onPress={() => setEditing(true)}
                className="w-full sm:w-auto transition-transform transform hover:scale-105"
              >
                <PencilSquareIcon className="h-5 w-5 mr-2" /> Editar perfil
              </Button>
            ) : (
              <>
                <Button
                  color="danger"
                  onPress={handleCancel}
                  className="w-1/2 sm:w-auto transition-transform transform hover:scale-105"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" /> Cancelar
                </Button>
                <Button
                  color="success"
                  onPress={handleSave}
                  className="w-1/2 sm:w-auto transition-transform transform hover:scale-105"
                >
                  <CheckIcon className="h-5 w-5 mr-2" /> Guardar
                </Button>
              </>
            )}
          </div>
          <Button
            className="w-full mt-4"
            variant="flat"
            onPress={() => navigate('/')}
          >
            Volver al inicio
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
