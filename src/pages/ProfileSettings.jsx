// src/pages/ProfileSettings.jsx
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Input, Avatar, Switch } from '@heroui/react';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isRounded, setIsRounded] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const getUserProfile = async () => {
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

    let finalAvatarUrl = avatarUrl;

    // Si seleccionó un archivo, subimos a Supabase Storage
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars') // nombre exacto del bucket
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) {
        alert('Error subiendo avatar');
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
  };

  if (!profile) return <p className="text-center mt-10">Cargando perfil...</p>;

  return (
    <Card className="w-full max-w-md">
      <CardBody className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">
          Configuración de perfil ⚙️
        </h1>

        {/* Avatar presionable */}
        <div className="flex flex-col items-center">
          <Avatar
            src={avatarUrl || undefined}
            className={`w-28 h-28 mb-3 cursor-pointer ${
              isRounded ? 'rounded-full' : 'rounded-md'
            }`}
            onClick={handleAvatarClick}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleAvatarChange}
          />
          <p className="text-gray-500 text-sm">Rol: {profile.role}</p>
        </div>

        {/* Switch para redondear o cuadrar avatar */}
        <div className="flex items-center gap-2 justify-center">
          <span>Redondear avatar</span>
          <Switch checked={isRounded} onChange={(val) => setIsRounded(val)} />
        </div>

        {/* Formulario */}
        <Input
          label="Nombre completo"
          value={fullName}
          disabled={!editing}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Usuario"
          value={username}
          disabled={!editing}
          onChange={(e) => setUsername(e.target.value)}
        />

        {!editing ? (
          <Button color="primary" onPress={() => setEditing(true)}>
            Editar perfil ✏️
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button color="success" onPress={handleSave}>
              Guardar ✅
            </Button>
            <Button color="danger" onPress={() => setEditing(false)}>
              Cancelar ❌
            </Button>
          </div>
        )}

        <Button className="mt-4" variant="flat" onPress={() => navigate('/')}>
          Volver al inicio
        </Button>
      </CardBody>
    </Card>
  );
}
