// src/pages/Reuniones.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardBody, Button, Input } from '@heroui/react';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

export default function Reuniones() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin states
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [meetingName, setMeetingName] = useState('');
  const [meetingLeader, setMeetingLeader] = useState('');

  // Miembro state
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const init = async () => {
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
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) setProfile(data);

      fetchMeetings();
    };
    init();
  }, [navigate]);

  const fetchMeetings = async () => {
    const { data: active } = await supabase
      .from('meetings')
      .select('*')
      .eq('active', true)
      .single();

    const { data: history } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false });

    setActiveMeeting(active || null);
    setMeetings(history || []);
    setLoading(false);

    // Si hay reunión activa y eres admin, también carga asistentes
    if (active) {
      const { data: atts } = await supabase
        .from('attendees')
        .select('*')
        .eq('meeting_id', active.id);
      setAttendees(atts || []);
    }
  };

  // Admin actions
  const handleCreateMeeting = async () => {
    if (!meetingName || !meetingLeader) return alert('Completa los campos');

    const { data } = await supabase
      .from('meetings')
      .insert([{ name: meetingName, leader: meetingLeader, active: true }])
      .select()
      .single();

    setActiveMeeting(data);
    setMeetingName('');
    setMeetingLeader('');
    setAttendees([]);
  };

  const handleCloseMeeting = async () => {
    if (!activeMeeting) return;
    await supabase
      .from('meetings')
      .update({ active: false })
      .eq('id', activeMeeting.id);
    setActiveMeeting(null);
    setAttendees([]);
  };

  // Miembro actions
  const handleScanQR = async (meetingId) => {
    if (scanned) return;
    const { data } = await supabase.from('attendees').insert([
      {
        meeting_id: meetingId,
        user_id: user.id,
        full_name: profile.full_name,
        username: profile.username,
      },
    ]);
    setScanned(true);
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="min-h-screen p-4 flex flex-col gap-6">
      {profile.role === 'Admin' ? (
        <>
          {/* ADMIN VIEW */}
          {activeMeeting ? (
            <Card className="p-4">
              <h2 className="text-xl font-bold">{activeMeeting.name}</h2>
              <p>Dirigida por: {activeMeeting.leader}</p>
              <Button color="danger" onPress={handleCloseMeeting}>
                Cerrar Reunión
              </Button>
              <div className="mt-4 flex flex-col items-center">
                <QRCodeCanvas value={activeMeeting.id} size={200} />
                <h3 className="mt-4 font-semibold">Asistentes</h3>
                <ul className="mt-2">
                  {attendees.map((a) => (
                    <li key={a.id}>
                      {a.username} ({a.full_name})
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-4">
                <h2 className="text-xl font-bold mb-4">Crear nueva reunión</h2>
                <Input
                  label="Nombre"
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                />
                <Input
                  label="Dirigida por"
                  value={meetingLeader}
                  onChange={(e) => setMeetingLeader(e.target.value)}
                />
                <Button
                  className="mt-4"
                  color="primary"
                  onPress={handleCreateMeeting}
                >
                  Abrir Reunión
                </Button>
              </Card>
              <h2 className="text-xl font-bold">Historial de reuniones</h2>
              <div className="flex flex-col gap-2">
                {meetings.map((m) => (
                  <Card key={m.id} className="p-2">
                    <CardBody>
                      <p className="font-semibold">{m.name}</p>
                      <p>Dirigida por: {m.leader}</p>
                      <p>Activa: {m.active ? 'Sí' : 'No'}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* MIEMBRO VIEW */}
          {activeMeeting ? (
            <Card className="p-4 flex flex-col items-center gap-4">
              <h2 className="text-xl font-bold">{activeMeeting.name}</h2>
              <QRCodeCanvas value={activeMeeting.id} size={200} />
              <Button
                color={scanned ? 'success' : 'primary'}
                onPress={() => handleScanQR(activeMeeting.id)}
              >
                {scanned ? 'Asistencia Registrada' : 'Marcar Asistencia'}
              </Button>
            </Card>
          ) : (
            <p>No hay reuniones activas actualmente.</p>
          )}
        </>
      )}
    </div>
  );
}
