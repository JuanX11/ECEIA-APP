import { Modal, Card, CardBody } from '@heroui/react';

export default function AttendeesModal({ open, onClose, attendees }) {
  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="font-bold text-lg p-2">Asistentes</h3>
      <div className="flex flex-col gap-2 p-2 max-h-96 overflow-y-auto">
        {attendees.map((a) => (
          <Card key={a.id} className="p-2 flex justify-between items-center">
            <CardBody className="flex justify-between items-center w-full">
              <div>
                <p className="font-semibold">{a.username}</p>
                <p>{a.full_name}</p>
                <p>
                  Escaneado a las: {new Date(a.scanned_at).toLocaleTimeString()}
                </p>
              </div>
              <img
                src={a.avatar_url || '/default-avatar.png'}
                className="w-10 h-10 rounded-full"
              />
            </CardBody>
          </Card>
        ))}
      </div>
    </Modal>
  );
}
