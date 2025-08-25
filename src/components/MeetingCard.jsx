import { Card, CardBody } from '@heroui/react';

export default function MeetingCard({ meeting, onClick }) {
  return (
    <Card className="p-2 cursor-pointer hover:bg-gray-50" onClick={onClick}>
      <CardBody>
        <p className="font-semibold">{meeting.name}</p>
        <p>Dirigida por: {meeting.leader}</p>
        <p>Activa: {meeting.active ? 'Sí' : 'No'}</p>
        <p>
          Inicio:{' '}
          {meeting.start_time
            ? new Date(meeting.start_time).toLocaleString()
            : '—'}
        </p>
        <p>
          Fin:{' '}
          {meeting.end_time ? new Date(meeting.end_time).toLocaleString() : '—'}
        </p>
      </CardBody>
    </Card>
  );
}
