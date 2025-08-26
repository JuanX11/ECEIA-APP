// src/pages/Miembros.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
} from "@heroui/react";

export default function Miembros() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return navigate("/login");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url, cellphonenum");

      if (!error && data) setProfiles(data);
      setLoading(false);
    };
    init();
  }, [navigate]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Lista de Miembros</h1>

      {/* Contenedor scroll solo para la tabla */}
      <div className="overflow-x-auto">
        <Table aria-label="Lista de miembros" removeWrapper>
          <TableHeader>
            <TableColumn>Perfil</TableColumn>
            <TableColumn>Nombre</TableColumn>
            <TableColumn>Rol</TableColumn>
            <TableColumn>Teléfono</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No hay miembros registrados">
            {profiles.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Avatar
                    src={member.avatar_url || undefined}
                    name={member.full_name}
                    className="w-10 h-10"
                  />
                </TableCell>
                <TableCell className="text-xs">{member.full_name}</TableCell>
                <TableCell className="capitalize">{member.role}</TableCell>
                <TableCell className="capitalize text-xs text-pretty">
  <a
    href={`https://wa.me/57${member.cellphonenum}`}
    target="_blank"
    rel="noopener noreferrer"
    className="hover:underline text-green-600"
  >
    {member.cellphonenum}
  </a>
</TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
