import React from 'react';
import { BirthDataProps } from '../utils/types';

interface BirthDataFormProps {
  birthData: BirthDataProps;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Form component for entering birth data
 */
export const BirthDataForm: React.FC<BirthDataFormProps> = ({
  birthData,
  onInputChange,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="mb-6 p-4 bg-slate-50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
          <input
            type="date"
            name="date"
            value={birthData.date}
            onChange={onInputChange}
            className="w-full p-2 border border-slate-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Time of Birth</label>
          <input
            type="time"
            name="time"
            value={birthData.time}
            onChange={onInputChange}
            disabled={birthData.timeUnknown}
            className="w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-100"
          />
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="timeUnknown"
              name="timeUnknown"
              checked={birthData.timeUnknown}
              onChange={onInputChange}
              className="mr-2"
            />
            <label htmlFor="timeUnknown" className="text-sm text-slate-700">I don't know my birth time</label>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Place of Birth</label>
          <input
            type="text"
            name="city"
            value={birthData.city}
            onChange={onInputChange}
            placeholder="City, Country"
            className="w-full p-2 border border-slate-300 rounded-md"
          />
        </div>
      </div>
      <div className="mt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Generate Chart
        </button>
      </div>
    </form>
  );
};

export default BirthDataForm;
