import { Card, CardBody, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure, Avatar, Button, ModalFooter } from "@heroui/react";
import { UsersIcon, CalendarIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function MeetingCard({ meeting }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Card className="p-3 cursor-pointer hover:bg-gray-50 shadow-md transition space-y-1 p-2" isPressable onPress={onOpen}>
        <CardBody className="space-y-1">
          <p className="font-semibold text-lg">{meeting.name}</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UsersIcon className="w-4 h-4" />
            <span>Dirigida por: {meeting.leader}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {meeting.active ? (
              <>
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Activa</span>
              </>
            ) : (
              <>
                <XCircleIcon className="w-4 h-4 text-red-500" />
                <span className="text-red-500">Inactiva</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>
              Inicio:{" "}
              {meeting.start_time
                ? new Date(meeting.start_time).toLocaleString()
                : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>
              Fin:{" "}
              {meeting.end_time
                ? new Date(meeting.end_time).toLocaleString()
                : "—"}
            </span>
          </div>
        </CardBody>
      </Card>


      {/* Modal dentro del mismo archivo */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col">
                Asistentes a {meeting.name}
              </ModalHeader>
              <ModalBody>
                {meeting.attendees?.length > 0 ? (
                  <ul className="space-y-3">
                    {meeting.attendees.map((att, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Avatar
                          name={att.name}
                          src={att.avatar_url}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">{att.name}</p>
                          <p className="text-xs text-gray-500">{att.role}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No hay asistentes registrados.
                  </p>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
