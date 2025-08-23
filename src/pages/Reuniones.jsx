// src/pages/Reuniones.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardBody, Button, Input } from '@heroui/react';
import { QRCodeCanvas } from 'qrcode.react';
import { BrowserMultiFormatReader } from '@zxing/browser';
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

  // Miembro states
  const [scanned, setScanned] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = useRef(null);
  const codeReader = useRef(null);

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

  // Admin actions
  const handleCreateMeeting = async () => {
    if (!meetingName || !meetingLeader) return alert('Completa los campos');

    const now = new Date().toISOString();
    const { data } = await supabase
      .from('meetings')
      .insert([
        {
          name: meetingName,
          leader: meetingLeader,
          active: true,
          start_time: now,
        },
      ])
      .single();

    setActiveMeeting(data);
    setMeetingName('');
    setMeetingLeader('');
    setAttendees([]);
  };

  const handleCloseMeeting = async () => {
    if (!activeMeeting) return;
    const now = new Date().toISOString();
    await supabase
      .from('meetings')
      .update({ active: false, end_time: now })
      .eq('id', activeMeeting.id);
    setActiveMeeting(null);
    setAttendees([]);
  };

  // Miembro actions: escanear QR
  const startScanner = async () => {
    if (!activeMeeting) return alert('No hay reunión activa');
    setScannerActive(true);
    codeReader.current = new BrowserMultiFormatReader();
    try {
      await codeReader.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result, err) => {
          if (result) {
            await handleScanQR(result.getText());
            stopScanner();
          }
        }
      );
    } catch (e) {
      console.error('Error al iniciar scanner', e);
    }
  };

  const stopScanner = () => {
    codeReader.current?.reset();
    setScannerActive(false);
  };

  const handleScanQR = async (meetingId) => {
    if (scanned) return;
    await supabase.from('attendees').insert([
      {
        meeting_id: meetingId,
        user_id: user.id,
        full_name: profile.full_name,
        username: profile.username,
      },
    ]);
    setScanned(true);
    alert('Asistencia registrada ✅');
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
              <p>
                Inicia: {new Date(activeMeeting.start_time).toLocaleString()}
              </p>
              {activeMeeting.end_time && (
                <p>
                  Finaliza: {new Date(activeMeeting.end_time).toLocaleString()}
                </p>
              )}
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
                      <p>
                        Activa: {m.active ? 'Sí' : 'No'}{' '}
                        {m.start_time &&
                          `| Inicia: ${new Date(
                            m.start_time
                          ).toLocaleString()}`}
                        {m.end_time &&
                          ` | Finaliza: ${new Date(
                            m.end_time
                          ).toLocaleString()}`}
                      </p>
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
              {!scannerActive && (
                <Button
                  color="primary"
                  onPress={startScanner}
                  disabled={scanned}
                >
                  {scanned ? 'Asistencia Registrada' : 'Escanear QR'}
                </Button>
              )}
              {scannerActive && (
                <div className="flex flex-col items-center gap-2">
                  <video ref={videoRef} className="w-64 h-64 border" />
                  <Button color="danger" onPress={stopScanner}>
                    Cancelar
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <p>No hay reuniones activas actualmente.</p>
          )}
        </>
      )}
    </div>
  );
}
