"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, MapPinIcon, AcademicCapIcon, BriefcaseIcon, HeartIcon } from "@heroicons/react/24/outline";
import { getAdvisorInitials, getAdvisorColor, type Advisor } from "~/lib/chat";

interface AdvisorProfileModalProps {
  advisor: Advisor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdvisorProfileModal({ advisor, isOpen, onClose }: AdvisorProfileModalProps) {
  if (!advisor) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    {advisor.image ? (
                      <img
                        src={advisor.image}
                        alt={advisor.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-medium ${getAdvisorColor(advisor.id)}`}>
                        {getAdvisorInitials(advisor.name)}
                      </div>
                    )}
                    <div>
                      <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900">
                        {advisor.name}
                      </Dialog.Title>
                      <p className="text-lg text-gray-600 mb-2">{advisor.title}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {advisor.location.city}, {advisor.location.region}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                    title="Close advisor profile"
                    aria-label="Close advisor profile modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* One-liner */}
                <div className="mb-6">
                  <p className="text-lg text-gray-700 italic">"{advisor.oneLiner}"</p>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">About</h4>
                  <p className="text-gray-700 leading-relaxed">{advisor.bio}</p>
                </div>

                {/* Detailed Background */}
                {advisor.detailedBackground && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Background</h4>
                    <p className="text-gray-700 leading-relaxed">{advisor.detailedBackground}</p>
                  </div>
                )}

                {/* Experience & Specialties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {advisor.experience && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                        <BriefcaseIcon className="w-5 h-5 mr-2" />
                        Experience
                      </h4>
                      <p className="text-gray-700">{advisor.experience}</p>
                    </div>
                  )}

                  {advisor.specialties && advisor.specialties.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                        <AcademicCapIcon className="w-5 h-5 mr-2" />
                        Specialties
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {advisor.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Personal Interests */}
                {advisor.personalInterests && advisor.personalInterests.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <HeartIcon className="w-5 h-5 mr-2" />
                      Personal Interests
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {advisor.personalInterests.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Communication Style */}
                {advisor.communicationStyle && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Communication Style</h4>
                    <p className="text-gray-700">{advisor.communicationStyle}</p>
                  </div>
                )}

                {/* Mission */}
                {advisor.mission && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Mission</h4>
                    <p className="text-gray-700">{advisor.mission}</p>
                  </div>
                )}

                {/* Tags */}
                {advisor.tags && advisor.tags.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Expertise Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {advisor.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    Start Conversation
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
