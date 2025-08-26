import { useState, useEffect } from 'react';
import { supabase } from './../supabaseClient';
import {
  Card, CardBody, Button, Input, Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,

  useDisclosure,
} from '@heroui/react';
import { QRCodeCanvas } from 'qrcode.react';
import AttendeesModal from './AttendeesModal';
import MeetingCard from './MeetingCard';

export default function AdminView({ profile }) {
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [meetingName, setMeetingName] = useState('');
  const [meetingLeader, setMeetingLeader] = useState('');
  const [selectedMeetingAttendees, setSelectedMeetingAttendees] = useState([]);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  // Traer historial y reunión activa
  useEffect(() => {
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
    };

    fetchMeetings();
  }, []);

  // Realtime: solo cuando hay reunión activa
  useEffect(() => {
    if (!activeMeeting) return;

    const channel = supabase
      .channel(`realtime-attendees-${activeMeeting.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendees',
          filter: `meeting_id=eq.${activeMeeting.id}`,
        },
        (payload) => {
          setAttendees((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeMeeting]);

  const handleCreateMeeting = async () => {
    if (!meetingName || !meetingLeader) return alert('Completa los campos');

    const { data, error } = await supabase
      .from('meetings')
      .insert(
        [
          {
            name: meetingName,
            leader: meetingLeader,
            active: true,
            start_time: new Date(),
          },
        ],
        { returning: 'representation' }
      )
      .single();

    if (error) {
      console.error(error);
      return alert('Error al crear la reunión');
    }

    setActiveMeeting(data);
    setMeetingName('');
    setMeetingLeader('');
    setAttendees([]);
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
      .select('*')
      .eq('meeting_id', meetingId)
      .order('scanned_at', { ascending: true });
    setAttendees(data || []);
  };

  const handleOpenMeetingDetails = async (meetingId) => {
    const { data } = await supabase
      .from('attendees')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('scanned_at', { ascending: true });

    setSelectedMeetingAttendees(data || []);
    setShowAttendeesModal(true);
  };
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (

    <div className="flex flex-col gap-6">
      {activeMeeting ? (
        <Card className="p-4">
          <h2 className="text-xl font-bold">{activeMeeting.name}</h2>
          <p>Dirigida por: {activeMeeting.leader}</p>
          <p>Inicio: {new Date(activeMeeting.start_time).toLocaleString()}</p>
          <Button color="danger" onPress={handleCloseMeeting}>
            Cerrar Reunión
          </Button>

          <div className="mt-4 flex flex-col items-center">
            <QRCodeCanvas value={activeMeeting.id.toString()} size={200} />
            <h3 className="mt-4 font-semibold">Asistentes</h3>
            <table className="table-auto mt-2 border-collapse border border-gray-200">
              <tbody>
                {attendees.map((a) => (
                  <tr key={a.id} className="border-b border-gray-200">
                    <td className="px-2 py-1">{a.username}</td>
                    <td className="px-2 py-1">{a.full_name}</td>
                    <td className="px-2 py-1">
                      <img
                        src={a.avatar_url || '/default-avatar.png'}
                        className="w-8 h-8 rounded-full"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <>
          <Card className="z-40 p-4 fixed bottom-0 left-0 w-full shadow-lg ">
            <Button onPress={onOpen} className="my-3 w-full" color="primary">
              Iniciar Reunión
            </Button>
          </Card>

          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">Nueva Reunión</ModalHeader>
                  <ModalBody>

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
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button color="primary" onPress={handleCreateMeeting}>
                      Crear
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </>
      )}

      {/* Historial: solo si no hay reunión activa */}
      {!activeMeeting && (
        <>
          <h2 className="text-xl font-bold">Historial de reuniones</h2>
          <div className="flex flex-col gap-2">
            {meetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                onClick={() => handleOpenMeetingDetails(m.id)}
              />
            ))}
          </div>
        </>
      )}

      <AttendeesModal
        open={showAttendeesModal}
        onClose={() => setShowAttendeesModal(false)}
        attendees={selectedMeetingAttendees}
      />
    </div>
  );
}
