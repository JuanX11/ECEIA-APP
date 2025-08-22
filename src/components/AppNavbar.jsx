// src/components/AppNavbar.jsx
import React, { useEffect, useState } from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  Divider,
  DropdownItem,
  Avatar,
  Link,
} from '@heroui/react'; // Asegúrate de que los componentes son de @heroui/react o NextUI
import { supabase } from '../supabaseClient';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'; // Importa los iconos de Heroicons

const logo = 'https://i.ibb.co/5gF40cM4/ECEIA-LOGO.jpg'; // Reemplaza con la URL de tu logo

export default function AppNavbar() {
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

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, role, avatar_url')
        .eq('id', user.id)
        .single();

      if (!error && data) setProfile(data);
    };

    getUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Inicio', path: '/', icon: <HomeIcon className="w-5 h-5" /> },
    {
      name: 'Asistencia',
      path: '/asistencia',
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    },
    {
      name: 'Miembros',
      path: '/miembros',
      icon: <UserGroupIcon className="w-5 h-5" />,
    },
    {
      name: 'Configuración',
      path: '/profile',
      icon: <Cog6ToothIcon className="w-5 h-5" />,
    },
  ];

  return (
    <div className="w-full">
      <Navbar isBordered className="shadow-sm">
        <NavbarContent justify="start">
          <NavbarBrand
            as={RouterLink}
            to="/"
            className="flex items-center gap-2"
          >
            <img src={logo} alt="ECEIA Logo" className="h-8 w-auto" />
            <p className="font-bold text-gray-800 hidden ">ECEIA</p>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent justify="end">
          {user && (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform ml-4"
                  color="primary" // Opcional: Un color para el borde del avatar
                  size="md"
                  src={profile?.avatar_url || undefined}
                  name={profile?.full_name || profile?.username || 'Usuario'}
                />
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Menú de usuario"
                variant="flat"
                className="p-2"
              >
                {/* Sección de Perfil */}
                <DropdownItem
                  key="info"
                  className="cursor-default opacity-100 p-4"
                  isReadOnly
                >
                  <div className="flex flex-col items-start gap-1">
                    <p className="font-semibold text-lg text-gray-800">
                      {profile?.full_name || profile?.username || 'Usuario'}
                    </p>
                    <p className="text-sm text-gray-500">{profile?.role}</p>
                  </div>
                </DropdownItem>
                {/* Separador */}
                <DropdownItem>
                  <Divider />
                </DropdownItem>

                {/* Opciones de Navegación */}
                {menuItems.map((item) => (
                  <DropdownItem
                    key={item.name}
                    as={RouterLink}
                    to={item.path}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 rounded-md transition-colors duration-150 hover:bg-gray-100"
                    startContent={item.icon}
                  >
                    <span className="text-base">{item.name}</span>
                  </DropdownItem>
                ))}

                {/* Separador para Cerrar Sesión */}
                <DropdownItem>
                  <Divider />
                </DropdownItem>

                {/* Opción de Cerrar Sesión */}
                <DropdownItem
                  key="logout"
                  onPress={handleLogout}
                  className="flex items-center gap-2 px-4 py-1 mt-2 font-medium text-red-500 rounded-md transition-colors duration-150 hover:bg-red-50"
                  startContent={
                    <ArrowRightStartOnRectangleIcon className="w-5 h-5 text-red-500" />
                  }
                >
                  <span className="text-base">Cerrar sesión</span>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </NavbarContent>
      </Navbar>
    </div>
  );
}
