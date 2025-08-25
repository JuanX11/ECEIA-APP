// src/components/MemberView.jsx
import { useState, useEffect } from 'react';
import { supabase } from './../supabaseClient';
import { Card, Button } from '@heroui/react';
import { Html5Qrcode } from 'html5-qrcode';

export default function MemberView({ profile }) {
  const [scanned, setScanned] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);

  useEffect(() => {
    fetchActiveMeeting();
  }, []);

  const fetchActiveMeeting = async () => {
    const { data } = await supabase
      .from('meetings')
      .select('*')
      .eq('active', true)
      .single();

    if (data) setActiveMeeting(data);
  };

  const startScanner = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Tu navegador no soporta cámara');
      return;
    }

    if (!activeMeeting) {
      alert('No hay reunión activa.');
      return;
    }

    const html5QrCode = new Html5Qrcode('reader');
    setScanner(html5QrCode);

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await handleScanQR(decodedText);
          html5QrCode.stop();
          setScanner(null);
        },
        (errorMessage) => {
          // Error de escaneo, se puede logear si quieres
          console.log('Escaneo fallido:', errorMessage);
        }
      );
    } catch (err) {
      console.error('No se pudo iniciar el escáner:', err);
    }
  };

  const handleScanQR = async (meetingId) => {
    if (scanned) return;
    try {
      await supabase.from('attendees').insert([
        {
          meeting_id: meetingId,
          user_id: profile.id,
          full_name: profile.full_name,
          username: profile.username,
          avatar_url: profile.avatar_url,
        },
      ]);
      setScanned(true);
      alert('Asistencia registrada correctamente');
    } catch (err) {
      console.error('Error registrando asistencia:', err);
      alert('No se pudo registrar la asistencia');
    }
  };

  return (
    <Card className="p-4 flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-center">
        {activeMeeting
          ? 'Escanea el QR para registrar tu asistencia'
          : 'No hay reuniones activas'}
      </h2>
      {activeMeeting && (
        <div id="reader" className="w-full h-96 bg-gray-100"></div>
      )}
      {activeMeeting && (
        <Button color={scanned ? 'success' : 'primary'} onPress={startScanner}>
          {scanned ? 'Asistencia Registrada' : 'Iniciar Escaneo'}
        </Button>
      )}
    </Card>
  );
}
