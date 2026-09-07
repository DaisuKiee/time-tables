import React from 'react';
import { X, User, Mail, Phone, Award, BookOpen, TrendingUp, Calendar, Edit2 } from 'lucide-react';
import {
  summarizeAllSubjects,
  describeRecency,
  currentAcademicYearStart,
  formatAcademicYear,
  STALE_AFTER_YEARS,
} from '../utils/teachingExperience';

const FacultyDetailsModal = ({ faculty, onClose, onEdit }) => {
  if (!faculty) return null;

  // Grouped by subject, most experienced first (recent teaching weighted higher)
  const subjectExperience = summarizeAllSubjects(faculty);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-white">
                    {faculty.user?.firstName} {faculty.user?.lastName}
                  </h3>
                  <p className="text-blue-100 mt-1">{faculty.employeeId}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {faculty.currentLoad || 0} hrs
                </p>
                <p className="text-xs text-gray-600">Current Load</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {faculty.qualifications?.length || 0}
                </p>
                <p className="text-xs text-gray-600">Qualifications</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {subjectExperience.length}
                </p>
                <p className="text-xs text-gray-600">
                  Distinct Subjects
                  {faculty.teachingHistory?.length
                    ? ` · ${faculty.teachingHistory.length} sem`
                    : ''}
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User size={20} className="mr-2" />
                Basic Information
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center">
                  <Mail size={16} className="text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm text-gray-900 ml-2">{faculty.user?.email}</span>
                </div>
                <div className="flex items-center">
                  <Award size={16} className="text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Max Load:</span>
                  <span className="text-sm text-gray-900 ml-2">{faculty.maxLoad} hours/week</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp size={16} className="text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    faculty.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {faculty.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Workload Progress */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp size={20} className="mr-2" />
                Workload Status
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {faculty.currentLoad || 0} / {faculty.maxLoad} hours
                  </span>
                  <span className={`text-sm font-semibold ${
                    (faculty.currentLoad || 0) > faculty.maxLoad
                      ? 'text-red-600'
                      : (faculty.currentLoad || 0) / faculty.maxLoad > 0.8
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}>
                    {Math.round(((faculty.currentLoad || 0) / faculty.maxLoad) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      (faculty.currentLoad || 0) > faculty.maxLoad
                        ? 'bg-red-600'
                        : (faculty.currentLoad || 0) / faculty.maxLoad > 0.8
                        ? 'bg-orange-600'
                        : 'bg-green-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        ((faculty.currentLoad || 0) / faculty.maxLoad) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                {(faculty.currentLoad || 0) > faculty.maxLoad && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Overloaded by {(faculty.currentLoad || 0) - faculty.maxLoad} hours
                  </p>
                )}
              </div>
            </div>

            {/* Specializations */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen size={20} className="mr-2" />
                Areas of Specialization
              </h4>
              {faculty.specialization && faculty.specialization.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {faculty.specialization.map((spec, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-800"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No specializations listed</p>
              )}
            </div>

            {/* Qualifications */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award size={20} className="mr-2" />
                Educational Qualifications
              </h4>
              {faculty.qualifications && faculty.qualifications.length > 0 ? (
                <div className="space-y-3">
                  {faculty.qualifications.map((qual, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{qual.degree}</p>
                          <p className="text-sm text-gray-600">{qual.field}</p>
                          <p className="text-sm text-gray-500">{qual.institution}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {qual.yearObtained}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No qualifications recorded</p>
              )}
            </div>

            {/* Teaching History - grouped by subject, ranked by recency-weighted experience */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar size={20} className="mr-2" />
                  Subject Experience
                </h4>
                <span className="text-xs text-gray-500">
                  AY {formatAcademicYear(currentAcademicYearStart())}
                </span>
              </div>

              {subjectExperience.length > 0 ? (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Ordered by experience, with recent teaching weighted more heavily than older
                    teaching. This is the same ranking the AI uses to recommend instructors.
                  </p>
                  <div className="space-y-2">
                    {subjectExperience.map((s) => (
                      <div
                        key={s.key}
                        className={`rounded-lg p-3 border ${
                          s.isStale
                            ? 'bg-amber-50 border-amber-200'
                            : s.lastTaughtYearsAgo <= 1
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start min-w-0">
                            <BookOpen size={16} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {s.subjectCode || s.subjectName}
                              </p>
                              {s.subjectCode && s.subjectName && (
                                <p className="text-xs text-gray-600 truncate">{s.subjectName}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-gray-900">
                              {s.timesTaught}x taught
                            </p>
                            <p
                              className={`text-xs font-medium ${
                                s.isStale
                                  ? 'text-amber-700'
                                  : s.lastTaughtYearsAgo <= 1
                                  ? 'text-green-700'
                                  : 'text-gray-600'
                              }`}
                            >
                              last: {describeRecency(s.lastTaughtYearsAgo)}
                            </p>
                          </div>
                        </div>

                        {/* Per-occurrence timeline */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {s.occurrences.map((o, i) => (
                            <span
                              key={i}
                              title={`${o.semester || ''} ${o.academicYear} · ${describeRecency(o.yearsAgo)}${
                                o.rating ? ` · rated ${o.rating}/5` : ''
                              }`}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                o.yearsAgo === 0
                                  ? 'bg-green-600 text-white'
                                  : o.yearsAgo === 1
                                  ? 'bg-green-200 text-green-900'
                                  : o.yearsAgo >= STALE_AFTER_YEARS
                                  ? 'bg-gray-200 text-gray-600'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {o.academicYear}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                          <span>
                            Experience score:{' '}
                            <strong className="text-gray-900">
                              {s.weightedExperience.toFixed(2)}
                            </strong>
                          </span>
                          {s.avgRating && (
                            <span>
                              Rating:{' '}
                              <strong className="text-gray-900">
                                {s.avgRating.toFixed(1)}/5
                              </strong>
                            </span>
                          )}
                          {s.isStale && (
                            <span className="text-amber-700 font-medium">
                              Dated ({STALE_AFTER_YEARS}+ yrs)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">No teaching history recorded</p>
              )}
            </div>

            {/* Preferred Schedule */}
            {faculty.preferredSchedule && Object.keys(faculty.preferredSchedule).length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar size={20} className="mr-2" />
                  Preferred Schedule
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(faculty.preferredSchedule, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit2 size={18} className="mr-2" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDetailsModal;
