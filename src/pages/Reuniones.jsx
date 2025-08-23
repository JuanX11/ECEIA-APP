// src/pages/Reuniones.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardBody, Button, Input, Modal, Avatar } from '@heroui/react';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

export default function Reuniones() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [meetingName, setMeetingName] = useState('');
  const [meetingLeader, setMeetingLeader] = useState('');

  const [selectedMeetingAttendees, setSelectedMeetingAttendees] = useState([]);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  const [scanned, setScanned] = useState(false);
  const [scanner, setScanner] = useState(null);

  // ==== Init user and profile ====
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return navigate('/login');
      setUser(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) setProfile(data);

      fetchMeetings();
      if (data?.role === 'Admin') subscribeToAttendeesRealtime();
      subscribeToMeetingsRealtime();
    };
    init();
  }, [navigate]);

  // ==== Fetch meetings ====
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

    if (active && profile?.role === 'Admin') fetchAttendees(active.id);
  };

  // ==== Admin actions ====
  const handleCreateMeeting = async () => {
    if (!meetingName || !meetingLeader) return alert('Completa los campos');

    const { data } = await supabase
      .from('meetings')
      .insert([
        {
          name: meetingName,
          leader: meetingLeader,
          active: true,
          start_time: new Date(),
        },
      ])
      .select()
      .single();

    setActiveMeeting(data);
    setMeetingName('');
    setMeetingLeader('');
    fetchAttendees(data.id);
    subscribeToAttendeesRealtime(data.id);
  };

  const handleCloseMeeting = async () => {
    if (!activeMeeting) return;
    await supabase
      .from('meetings')
      .update({ active: false, end_time: new Date() })
      .eq('id', activeMeeting.id);
    setActiveMeeting(null);
    setAttendees([]);
  };

  const fetchAttendees = async (meetingId) => {
    const { data } = await supabase
      .from('attendees')
      .select('*, profiles(avatar_url)')
      .eq('meeting_id', meetingId)
      .order('scanned_at', { ascending: true });
    setAttendees(data || []);
  };

  const subscribeToAttendeesRealtime = (meetingId = activeMeeting?.id) => {
    if (!meetingId) return;
    supabase
      .channel(`public:attendees:${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendees',
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => setAttendees((prev) => [...prev, payload.new])
      )
      .subscribe();
  };

  // ==== Realtime for meetings (historial) ====
  const subscribeToMeetingsRealtime = () => {
    supabase
      .channel('public:meetings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        (payload) => {
          setMeetings((prev) => {
            const index = prev.findIndex((m) => m.id === payload.new.id);
            if (payload.eventType === 'INSERT') return [payload.new, ...prev];
            if (payload.eventType === 'UPDATE') {
              if (index !== -1) {
                const updated = [...prev];
                updated[index] = payload.new;
                return updated;
              } else return [payload.new, ...prev];
            }
            if (payload.eventType === 'DELETE' && index !== -1) {
              const updated = [...prev];
              updated.splice(index, 1);
              return updated;
            }
            return prev;
          });
          if (payload.new.active) setActiveMeeting(payload.new);
          else if (activeMeeting?.id === payload.new.id) setActiveMeeting(null);
        }
      )
      .subscribe();
  };

  // ==== Miembro actions ====
  const startScanner = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Tu navegador no soporta cámara');
      return;
    }

    const html5QrCode = new Html5Qrcode('reader');
    setScanner(html5QrCode);

    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        handleScanQR(decodedText);
        html5QrCode.stop();
        setScanner(null);
      },
      (errorMessage) => {}
    );
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
  };

  // ==== Modal asistentes historial ====
  const handleOpenMeetingDetails = async (meetingId) => {
    const { data } = await supabase
      .from('attendees')
      .select('*, profiles(avatar_url)')
      .eq('meeting_id', meetingId)
      .order('scanned_at', { ascending: true });
    setSelectedMeetingAttendees(data || []);
    setShowAttendeesModal(true);
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="min-h-screen p-4 flex flex-col gap-6">
      {profile.role === 'Admin' ? (
        <>
          {activeMeeting ? (
            <Card className="p-4">
              <h2 className="text-xl font-bold">{activeMeeting.name}</h2>
              <p>Dirigida por: {activeMeeting.leader}</p>
              <p>
                Inicio: {new Date(activeMeeting.start_time).toLocaleString()}
              </p>
              <Button color="danger" onPress={handleCloseMeeting}>
                Cerrar Reunión
              </Button>
              <div className="mt-4 flex flex-col items-center">
                <QRCodeCanvas value={activeMeeting.id.toString()} size={200} />
                <h3 className="mt-4 font-semibold">Asistentes</h3>
                <div className="w-full max-w-md border border-gray-200 rounded-md overflow-hidden">
                  <div className="flex bg-gray-100 p-2 font-semibold">
                    <div className="flex-1">Nombre</div>
                    <div>Avatar</div>
                  </div>
                  {attendees.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center p-2 border-t border-gray-100"
                    >
                      <div className="flex-1">{a.full_name}</div>
                      <Avatar
                        size="sm"
                        src={a.profiles?.avatar_url || undefined}
                      />
                    </div>
                  ))}
                </div>
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
                    className="p-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleOpenMeetingDetails(m.id)}
                  >
                    <CardBody>
                      <p className="font-semibold">{m.name}</p>
                      <p>Dirigida por: {m.leader}</p>
                      <p>Activa: {m.active ? 'Sí' : 'No'}</p>
                      <p>
                        Inicio:{' '}
                        {m.start_time
                          ? new Date(m.start_time).toLocaleString()
                          : '—'}
                      </p>
                      <p>
                        Fin:{' '}
                        {m.end_time
                          ? new Date(m.end_time).toLocaleString()
                          : '—'}
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <Card className="p-4 flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">
            Escanea el QR para registrar tu asistencia
          </h2>
          <div id="reader" className="w-full h-96 bg-gray-100"></div>
          <Button
            color={scanned ? 'success' : 'primary'}
            onPress={startScanner}
          >
            {scanned ? 'Asistencia Registrada' : 'Iniciar Escaneo'}
          </Button>
        </Card>
      )}

      <Modal
        open={showAttendeesModal}
        onClose={() => setShowAttendeesModal(false)}
      >
        <h3 className="font-bold text-lg p-2">Asistentes</h3>
        <div className="flex flex-col gap-2 p-2 max-h-96 overflow-y-auto">
          {selectedMeetingAttendees.map((a) => (
            <Card key={a.id} className="p-2 flex items-center justify-between">
              <div>
                <p className="font-semibold">{a.username}</p>
                <p>{a.full_name}</p>
                <p>
                  Escaneado a las: {new Date(a.scanned_at).toLocaleTimeString()}
                </p>
              </div>
              <Avatar size="sm" src={a.profiles?.avatar_url || undefined} />
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
}
