// 📌 MeetingList.jsx
import { useState } from "react";
import { Input } from "@heroui/react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import MeetingCard from "./MeetingCard";

export default function MeetingList({ meetings }) {
  const [selectedDate, setSelectedDate] = useState("");

  // Filtrar reuniones según la fecha elegida
  const filteredMeetings = selectedDate
    ? meetings.filter(
        (m) =>
          new Date(m.start_time).toLocaleDateString("es-CO") ===
          new Date(selectedDate).toLocaleDateString("es-CO")
      )
    : meetings;

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Filtro de fecha */}
      <div className="flex items-center gap-2">
        <CalendarDaysIcon className="w-5 h-5 text-gray-500" />
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          variant="bordered"
          className="max-w-xs"
        />
        {selectedDate && (
          <button
            onClick={() => setSelectedDate("")}
            className="text-sm text-blue-500 hover:underline"
          >
            Quitar filtro
          </button>
        )}
      </div>

      {/* Lista de reuniones filtradas */}
      {filteredMeetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No hay reuniones para esta fecha.</p>
      )}
    </div>
  );
}
