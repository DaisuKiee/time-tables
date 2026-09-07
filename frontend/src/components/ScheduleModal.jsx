import { useState, useEffect } from 'react';
import { scheduleAPI, facultyAPI, subjectAPI, roomAPI } from '../services/api';
import toast from 'react-hot-toast';
import { X, Plus, Trash2 } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ScheduleModal = ({ mode, schedule, subjects: propSubjects, sections: propSections, faculty: propFaculty, rooms: propRooms, onClose, onDelete }) => {
  const { programCodes: PROGRAMS } = usePrograms();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    faculty: '',
    room: '',
    program: 'BSIT',
    yearLevel: 1,
    section: 'A',
    shift: 'Day',
    academicYear: '2024-2025',
    semester: 1,
    timeSlots: [{ day: 'Monday', startTime: '08:00', endTime: '09:00', type: 'Lecture' }],
    maxStudents: 40,
    isPublished: false,
    isActive: true
  });

  useEffect(() => {
    // Use props data if available, otherwise load from API
    if (propSubjects && propFaculty && propRooms) {
      setSubjects(propSubjects);
      setFaculty(propFaculty);
      setRooms(propRooms);
    } else {
      loadData();
    }
    
    if (mode === 'edit' && schedule) {
      setFormData({
        subject: schedule.subject?._id || '',
        faculty: schedule.faculty?._id || '',
        room: schedule.room?._id || '',
        program: schedule.program || 'BSIT',
        yearLevel: schedule.yearLevel || 1,
        section: schedule.section || 'A',
        shift: schedule.shift || 'Day',
        academicYear: schedule.academicYear || '2024-2025',
        semester: schedule.semester || 1,
        timeSlots: schedule.timeSlots && schedule.timeSlots.length > 0 
          ? schedule.timeSlots 
          : [{ day: 'Monday', startTime: '08:00', endTime: '09:00', type: 'Lecture' }],
        maxStudents: schedule.maxStudents || 40,
        isPublished: schedule.isPublished || false,
        isActive: schedule.isActive !== false
      });
    }
  }, [mode, schedule, propSubjects, propFaculty, propRooms]);

  const loadData = async () => {
    try {
      const [subjectsRes, facultyRes, roomsRes] = await Promise.all([
        subjectAPI.getAll(),
        facultyAPI.getAll(),
        roomAPI.getAll()
      ]);
      setSubjects(subjectsRes.data.data || []);
      setFaculty(facultyRes.data.data || []);
      setRooms(roomsRes.data.data || []);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      timeSlots: [...formData.timeSlots, { day: 'Monday', startTime: '08:00', endTime: '09:00', type: 'Lecture' }]
    });
  };

  const updateTimeSlot = (index, field, value) => {
    const newSlots = [...formData.timeSlots];
    newSlots[index][field] = value;
    setFormData({
      ...formData,
      timeSlots: newSlots
    });
  };

  const removeTimeSlot = (index) => {
    if (formData.timeSlots.length > 1) {
      setFormData({
        ...formData,
        timeSlots: formData.timeSlots.filter((_, i) => i !== index)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        yearLevel: parseInt(formData.yearLevel),
        semester: parseInt(formData.semester),
        maxStudents: parseInt(formData.maxStudents)
      };

      if (mode === 'create') {
        await scheduleAPI.create(submitData);
        toast.success('Schedule created successfully');
      } else {
        await scheduleAPI.update(schedule._id, submitData);
        toast.success('Schedule updated successfully');
      }
      onClose(true);
    } catch (error) {
      console.error('Submit error:', error);
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (mode === 'edit' && schedule) {
      await onDelete(schedule._id); // Wait for delete to complete
      onClose(true); // Then close and refresh
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={() => onClose(false)}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">
                {mode === 'create' ? 'Add Schedule Entry' : 'Edit Schedule Entry'}
              </h3>
              <button onClick={() => onClose(false)} className="text-white hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select subject...</option>
                  {subjects.map(subj => (
                    <option key={subj._id} value={subj._id}>
                      {subj.subjectCode} - {subj.subjectName} ({subj.program})
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faculty *
                </label>
                <select
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select faculty...</option>
                  {faculty.map(fac => (
                    <option key={fac._id} value={fac._id}>
                      {fac.user?.firstName} {fac.user?.lastName} - {fac.employeeId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room *
                </label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select room...</option>
                  {rooms.map(room => (
                    <option key={room._id} value={room._id}>
                      {room.roomCode || room.roomNumber} — {room.roomName || room.building} (Cap: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program *</label>
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {PROGRAMS.map(prog => (
                    <option key={prog} value={prog}>{prog}</option>
                  ))}
                </select>
              </div>

              {/* Year Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year Level *</label>
                <select
                  name="yearLevel"
                  value={formData.yearLevel}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4].map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section *</label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  placeholder="e.g., A, B, C"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Shift */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift/Schedule *</label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Day">Day Schedule (7:00 AM - 4:00 PM)</option>
                  <option value="Night">Night Schedule (4:00 PM - 10:00 PM)</option>
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 2024-2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Max Students */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Students *</label>
                <input
                  type="number"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleChange}
                  required
                  min="1"
                  max="200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Slots */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slots *
                </label>
                {formData.timeSlots.map((slot, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      <select
                        value={slot.day}
                        onChange={(e) => updateTimeSlot(index, 'day', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        {DAYS.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <select
                        value={slot.type}
                        onChange={(e) => updateTimeSlot(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="Lecture">Lecture</option>
                        <option value="Laboratory">Laboratory</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        disabled={formData.timeSlots.length === 1}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} className="mr-1" />
                  Add Time Slot
                </button>
              </div>

              {/* Checkboxes */}
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Published (visible to students)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-between">
              <div>
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : mode === 'create' ? 'Create Schedule' : 'Update Schedule'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
