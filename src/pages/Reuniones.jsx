// src/pages/Reuniones.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardBody, Button, Input } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeCanvas } from 'qrcode.react';

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

  // Miembro states
  const [scanned, setScanned] = useState(false);
  const qrRef = useRef(null);

  // Para historial de asistentes
  const [selectedMeetingAttendees, setSelectedMeetingAttendees] = useState([]);

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

      await fetchMeetings();

      // Subscribirse a cambios en asistencia en tiempo real
      supabase
        .channel('public:attendees')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'attendees' },
          (payload) => {
            if (activeMeeting && payload.new.meeting_id === activeMeeting.id) {
              setAttendees((prev) => [...prev, payload.new]);
            }
          }
        )
        .subscribe();
    };
    init();

    // Cleanup: cancelar realtime cuando se desmonte
    return () => supabase.removeAllChannels();
    // eslint-disable-next-line
  }, [activeMeeting]);

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
    if (active) fetchAttendees(active.id);
    setLoading(false);
  };

  const fetchAttendees = async (meetingId) => {
    const { data } = await supabase
      .from('attendees')
      .select('*')
      .eq('meeting_id', meetingId);
    setAttendees(data || []);
  };

  // Admin
  const handleCreateMeeting = async () => {
    if (!meetingName || !meetingLeader) return alert('Completa los campos');

    const { data, error } = await supabase
      .from('meetings')
      .insert([
        {
          name: meetingName,
          leader: meetingLeader,
          active: true,
          start_time: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) return alert('Error creando reunión');

    setActiveMeeting(data);
    setMeetingName('');
    setMeetingLeader('');
    setAttendees([]);
  };

  const handleCloseMeeting = async () => {
    if (!activeMeeting) return;
    await supabase
      .from('meetings')
      .update({ active: false, end_time: new Date().toISOString() })
      .eq('id', activeMeeting.id);
    setActiveMeeting(null);
    setAttendees([]);
  };

  // Miembro
  const handleScan = async (decodedText) => {
    if (scanned || !activeMeeting) return;

    // Registrar asistencia
    const { error } = await supabase.from('attendees').insert([
      {
        meeting_id: activeMeeting.id,
        user_id: user.id,
        full_name: profile.full_name,
        username: profile.username,
      },
    ]);

    if (error) return alert('Error registrando asistencia');

    setScanned(true);
    alert('Asistencia registrada ✅');
  };

  // Inicializar QR scanner para miembros
  useEffect(() => {
    if (profile?.role !== 'Miembro' || !activeMeeting) return;

    const scanner = new Html5QrcodeScanner(
      qrRef.current,
      { fps: 10, qrbox: 250 },
      false
    );
    scanner.render(handleScan);
    return () => scanner.clear().catch(() => {});
  }, [profile, activeMeeting]);

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
              <p>
                Inicio: {new Date(activeMeeting.start_time).toLocaleString()}
              </p>
              <Button
                color="danger"
                className="mt-2"
                onPress={handleCloseMeeting}
              >
                Cerrar Reunión
              </Button>

              <div className="mt-4 flex flex-col items-center gap-4">
                <QRCodeCanvas value={activeMeeting.id} size={200} />
                <h3 className="mt-4 font-semibold">Asistentes</h3>
                {attendees.length === 0 && <p>No hay asistentes aún</p>}
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
                  <Card
                    key={m.id}
                    className="p-2 cursor-pointer"
                    onClick={() => fetchAttendees(m.id)}
                  >
                    <CardBody>
                      <p className="font-semibold">{m.name}</p>
                      <p>Dirigida por: {m.leader}</p>
                      <p>
                        Activa: {m.active ? 'Sí' : 'No'} | Inicio:{' '}
                        {new Date(m.start_time).toLocaleString()}
                        {m.end_time &&
                          ` | Fin: ${new Date(m.end_time).toLocaleString()}`}
                      </p>
                      <p>Asistentes: {attendees.length}</p>
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
              <div ref={qrRef} className="w-full flex justify-center"></div>
              <Button
                color={scanned ? 'success' : 'primary'}
                onPress={() => handleScan(activeMeeting.id)}
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
