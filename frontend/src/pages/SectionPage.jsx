import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { sectionAPI, facultyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, Edit2, Trash2, Search, Sun, Moon, 
  Users, BookOpen, X, Check, GraduationCap,
  Calendar, UserCheck, TrendingUp, Grid3x3, List, RefreshCw, Copy
} from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';

const SectionPage = () => {
  const [sections, setSections] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [regeneratingId, setRegeneratingId] = useState(null);

  const [formData, setFormData] = useState({
    program: 'BSIT',
    yearLevel: 1,
    sectionLetter: 'A',
    shift: 'Day',
    academicYear: '2024-2025',
    semester: 1,
    maxStudents: 40,
    adviser: '',
    description: ''
  });

  const { programCodes: programs } = usePrograms();
  const yearLevels = [1, 2, 3, 4];
  const sectionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const shifts = ['Day', 'Night'];

  useEffect(() => {
    loadSections();
    loadFaculty();
  }, []);

  // // Disable body scroll when modal is open
  // useEffect(() => {
  //   if (showModal) {
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.style.overflow = 'unset';
  //   }
  //   return () => {
  //     document.body.style.overflow = 'unset';
  //   };
  // }, [showModal]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await sectionAPI.getAll();
      setSections(response.data.data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const loadFaculty = async () => {
    try {
      const response = await facultyAPI.getAll();
      setFaculty(response.data.data || []);
    } catch (error) {
      console.error('Error loading faculty:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingSection) {
        await sectionAPI.update(editingSection._id, formData);
        toast.success('Section updated successfully!');
      } else {
        await sectionAPI.create(formData);
        toast.success('Section created successfully!');
      }
      
      handleCloseModal();
      loadSections();
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error(error.response?.data?.message || 'Failed to save section');
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({
      program: section.program,
      yearLevel: section.yearLevel,
      sectionLetter: section.sectionLetter,
      shift: section.shift,
      academicYear: section.academicYear,
      semester: section.semester,
      maxStudents: section.maxStudents,
      adviser: section.adviser?._id || '',
      description: section.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this section?');
    if (!confirmed) return;

    try {
      await sectionAPI.delete(id);
      toast.success('Section deleted successfully!');
      loadSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      
      // Show specific error message from backend
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.message;
        if (errorMessage?.includes('program')) {
          toast.error(errorMessage);
        } else {
          toast.error('You do not have permission to delete this section');
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete section');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSection(null);
    setFormData({
      program: 'BSIT',
      yearLevel: 1,
      sectionLetter: 'A',
      shift: 'Day',
      academicYear: '2024-2025',
      semester: 1,
      maxStudents: 40,
      adviser: '',
      description: ''
    });
  };

  const handleRegenerateCode = async (sectionId) => {
    if (!window.confirm('Are you sure you want to regenerate the enrollment code? The old code will no longer work.')) return;
    
    try {
      setRegeneratingId(sectionId);
      await sectionAPI.regenerateEnrollmentCode(sectionId);
      toast.success('Enrollment code regenerated successfully!');
      loadSections();
    } catch (error) {
      console.error('Regenerate code error:', error);
      toast.error(error.response?.data?.message || 'Failed to regenerate enrollment code');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Enrollment code copied!');
  };

  const filteredSections = sections.filter(section => {
    const matchesSearch = section.sectionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.program.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = !filterProgram || section.program === filterProgram;
    const matchesShift = !filterShift || section.shift === filterShift;
    const matchesYear = !filterYear || section.yearLevel === parseInt(filterYear);
    
    return matchesSearch && matchesProgram && matchesShift && matchesYear;
  });

  // Calculate statistics
  const stats = {
    total: sections.length,
    day: sections.filter(s => s.shift === 'Day').length,
    night: sections.filter(s => s.shift === 'Night').length,
    totalStudents: sections.reduce((sum, s) => sum + (s.currentStudents || 0), 0),
    averageCapacity: sections.length > 0 
      ? Math.round((sections.reduce((sum, s) => sum + (s.currentStudents || 0), 0) / sections.reduce((sum, s) => sum + s.maxStudents, 0)) * 100)
      : 0
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Section Management
            </h1>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Section</span>
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Create and manage sections with Day/Night shift indicators
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          <div className="bg-blue-600 text-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 opacity-80" />
              <span className="text-xs font-medium opacity-80">TOTAL</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold">{stats.total}</div>
            <div className="text-xs opacity-80 mt-1">Sections</div>
          </div>

          <div className="bg-yellow-500 text-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Sun className="w-5 h-5 opacity-80" />
              <span className="text-xs font-medium opacity-80">DAY</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold">{stats.day}</div>
            <div className="text-xs opacity-80 mt-1">Day Shift</div>
          </div>

          <div className="bg-indigo-600 text-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Moon className="w-5 h-5 opacity-80" />
              <span className="text-xs font-medium opacity-80">NIGHT</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold">{stats.night}</div>
            <div className="text-xs opacity-80 mt-1">Night Shift</div>
          </div>

          <div className="bg-green-600 text-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 opacity-80" />
              <span className="text-xs font-medium opacity-80">STUDENTS</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold">{stats.totalStudents}</div>
            <div className="text-xs opacity-80 mt-1">Total Enrolled</div>
          </div>

          <div className="bg-purple-600 text-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 opacity-80" />
              <span className="text-xs font-medium opacity-80">CAPACITY</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold">{stats.averageCapacity}%</div>
            <div className="text-xs opacity-80 mt-1">Avg. Filled</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by section code or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm transition-all"
              >
                <option value="">All Programs</option>
                {programs.map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>

              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm transition-all"
              >
                <option value="">All Years</option>
                {yearLevels.map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>

              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm transition-all"
              >
                <option value="">All Shifts</option>
                <option value="Day">Day</option>
                <option value="Night">Night</option>
              </select>

              {/* View Toggle */}
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                  title="Grid View"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 border-l border-gray-300 dark:border-gray-600 transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || filterProgram || filterShift || filterYear) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                    Search: {searchTerm}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100" 
                      onClick={() => setSearchTerm('')}
                    />
                  </span>
                )}
                {filterProgram && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                    Program: {filterProgram}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100" 
                      onClick={() => setFilterProgram('')}
                    />
                  </span>
                )}
                {filterYear && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                    Year: {filterYear}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100" 
                      onClick={() => setFilterYear('')}
                    />
                  </span>
                )}
                {filterShift && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                    Shift: {filterShift}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100" 
                      onClick={() => setFilterShift('')}
                    />
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterProgram('');
                    setFilterShift('');
                    setFilterYear('');
                  }}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sections Grid or List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading sections...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {sections.length === 0 ? 'No sections created yet' : 'No sections match your filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {sections.length === 0 
                ? 'Get started by creating your first section'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {sections.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Section
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSections.map((section) => (
              <div
                key={section._id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 transform hover:-translate-y-1"
              >
                {/* Section Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {section.sectionCode}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {section.program} • Year {section.yearLevel}
                    </p>
                    {/* Enrollment Code Badge */}
                    {section.enrollmentCode ? (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg px-3 py-1.5">
                          <p className="text-xs text-green-700 dark:text-green-300 font-medium">Enrollment Code:</p>
                          <p className="text-lg font-bold text-green-900 dark:text-green-100 font-mono tracking-wider">{section.enrollmentCode}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleCopyCode(section.enrollmentCode)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-colors"
                            title="Copy Code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRegenerateCode(section._id)}
                            disabled={regeneratingId === section._id}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Regenerate Code"
                          >
                            <RefreshCw className={`w-4 h-4 ${regeneratingId === section._id ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 inline-block">
                        <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5">
                          <p className="text-xs text-gray-500 font-medium">Enrollment Code:</p>
                          <p className="text-sm text-gray-400 italic">Not generated yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Shift Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold shadow-sm ${
                    section.shift === 'Day' 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-indigo-600 text-white'
                  }`}>
                    {section.shift === 'Day' ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                    <span className="text-xs">{section.shift}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Student Capacity</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {section.currentStudents || 0} / {section.maxStudents}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        ((section.currentStudents || 0) / section.maxStudents * 100) >= 90
                          ? 'bg-red-600'
                          : ((section.currentStudents || 0) / section.maxStudents * 100) >= 70
                          ? 'bg-yellow-500'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min((section.currentStudents || 0) / section.maxStudents * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Section Details */}
                <div className="space-y-2.5 mb-4">
                  {section.adviser && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Adviser</p>
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {section.adviser.user?.firstName} {section.adviser.user?.lastName}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Academic Period</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {section.academicYear} • Sem {section.semester}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(section)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(section._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Program & Year
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Shift
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Adviser
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Academic Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSections.map((section) => (
                    <tr 
                      key={section._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {section.sectionCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">{section.program}</div>
                          <div className="text-gray-600 dark:text-gray-400">Year {section.yearLevel}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          section.shift === 'Day'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        }`}>
                          {section.shift === 'Day' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                          {section.shift}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white font-medium">
                            {section.currentStudents || 0} / {section.maxStudents}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {section.adviser ? (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {section.adviser.user?.firstName} {section.adviser.user?.lastName}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">No adviser</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {section.academicYear}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Semester {section.semester}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(section)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(section._id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-fadeIn">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative z-[10000] animate-slideUp">
                {/* Modal Header */}
                <div className="bg-blue-600 px-6 py-5 flex items-center justify-between flex-shrink-0 shadow-lg rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {editingSection ? 'Edit Section' : 'Create New Section'}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {editingSection ? 'Update section information' : 'Add a new section to the system'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900">
                <form onSubmit={handleSubmit} className="p-6" id="section-form">
                  {/* Section Code Preview */}
                  <div className="bg-blue-600 text-white rounded-xl p-4 mb-6">
                    <div className="text-sm font-medium opacity-90 mb-1">Section Code Preview</div>
                    <div className="text-2xl font-bold">
                      {formData.program}-{formData.yearLevel}{formData.sectionLetter}
                    </div>
                    <div className="text-sm opacity-90 mt-1">
                      {formData.shift} Shift • {formData.academicYear} • Semester {formData.semester}
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Program */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Program <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.program}
                          onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                          required
                        >
                          {programs.map(prog => (
                            <option key={prog} value={prog}>{prog}</option>
                          ))}
                        </select>
                      </div>

                      {/* Year Level */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Year Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.yearLevel}
                          onChange={(e) => setFormData({ ...formData, yearLevel: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                          required
                        >
                          {yearLevels.map(year => (
                            <option key={year} value={year}>Year {year}</option>
                          ))}
                        </select>
                      </div>

                      {/* Section Letter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Section Letter <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {sectionLetters.slice(0, 8).map(letter => (
                            <button
                              key={letter}
                              type="button"
                              onClick={() => setFormData({ ...formData, sectionLetter: letter })}
                              className={`px-3 py-2.5 rounded-lg font-semibold transition-all ${
                                formData.sectionLetter === letter
                                  ? 'bg-blue-600 text-white shadow-md scale-105'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {letter}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shift */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Shift <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {shifts.map(shift => (
                            <button
                              key={shift}
                              type="button"
                              onClick={() => setFormData({ ...formData, shift })}
                              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                                formData.shift === shift
                                  ? shift === 'Day'
                                    ? 'bg-yellow-500 text-white shadow-lg scale-105'
                                    : 'bg-indigo-600 text-white shadow-lg scale-105'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {shift === 'Day' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                              {shift}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Period */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      Academic Period
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Academic Year */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Academic Year <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.academicYear}
                          onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                          placeholder="2024-2025"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                          required
                        />
                      </div>

                      {/* Semester */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Semester <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[1, 2].map(sem => (
                            <button
                              key={sem}
                              type="button"
                              onClick={() => setFormData({ ...formData, semester: sem })}
                              className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
                                formData.semester === sem
                                  ? 'bg-purple-600 text-white shadow-md scale-105'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {sem === 1 ? '1st' : '2nd'} Sem
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Details */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      Section Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Max Students */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Maximum Students
                        </label>
                        <input
                          type="number"
                          value={formData.maxStudents}
                          onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                          min="1"
                          max="100"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      </div>

                      {/* Adviser */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Section Adviser <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                        </label>
                        <select
                          value={formData.adviser}
                          onChange={(e) => setFormData({ ...formData, adviser: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                        >
                          <option value="">No adviser assigned</option>
                          {faculty.map(fac => (
                            <option key={fac._id} value={fac._id}>
                              {fac.user?.firstName} {fac.user?.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Description */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Description (Optional)
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          placeholder="Add any additional notes or information about this section..."
                          className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

                {/* Modal Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] rounded-b-2xl">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="section-form"
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Check className="w-5 h-5" />
                    {editingSection ? 'Update Section' : 'Create Section'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SectionPage;
