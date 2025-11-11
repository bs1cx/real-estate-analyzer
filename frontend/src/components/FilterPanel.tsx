'use client';

import { useMemo } from 'react';

import clsx from 'clsx';

import type { PriceAnalysisFilters } from '@/lib/api';

type FilterKey = keyof PriceAnalysisFilters;

type FilterPanelProps = {
  filters: PriceAnalysisFilters;
  onChange: (key: FilterKey, value: string | number | undefined) => void;
  onSubmit: (mode: 'sale' | 'rent' | 'investment') => void;
  isLoading?: boolean;
};

const numericFields: FilterKey[] = ['min_size', 'max_size', 'min_rooms', 'max_rooms', 'min_age', 'max_age'];

const fieldLabels: Record<FilterKey, string> = {
  city: 'City',
  district: 'District',
  neighbourhood: 'Neighbourhood',
  property_type: 'Property Type',
  listing_type: 'Listing Type',
  min_size: 'Min Size (m²)',
  max_size: 'Max Size (m²)',
  min_rooms: 'Min Rooms',
  max_rooms: 'Max Rooms',
  min_age: 'Min Building Age',
  max_age: 'Max Building Age',
};

export function FilterPanel({ filters, onChange, onSubmit, isLoading }: FilterPanelProps) {
  const entries = useMemo(() => Object.entries(fieldLabels) as Array<[FilterKey, string]>, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Property Filters</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map(([key, label]) => {
          const isNumeric = numericFields.includes(key);
          const isListingType = key === 'listing_type';
          return (
            <label key={key} className="flex flex-col gap-1 text-sm text-slate-600">
              <span>{label}</span>
              {isListingType ? (
                <select
                  value={filters[key] ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    onChange(key, value === '' ? undefined : value);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All Listings</option>
                  <option value="sale">Sale</option>
                  <option value="rent">Rent</option>
                </select>
              ) : (
                <input
                  type={isNumeric ? 'number' : 'text'}
                  value={filters[key] ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === '') {
                      onChange(key, undefined);
                      return;
                    }
                    onChange(key, isNumeric ? Number(value) : value);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder={isNumeric ? '0' : `Enter ${label.toLowerCase()}`}
                  min={isNumeric ? 0 : undefined}
                />
              )}
            </label>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <ActionButton label="Show Sale Prices" onClick={() => onSubmit('sale')} isLoading={isLoading} />
        <ActionButton label="Show Rent Prices" onClick={() => onSubmit('rent')} isLoading={isLoading} />
        <ActionButton label="Investment Analysis" onClick={() => onSubmit('investment')} isPrimary isLoading={isLoading} />
      </div>
    </section>
  );
}

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  isPrimary?: boolean;
  isLoading?: boolean;
};

function ActionButton({ label, onClick, isPrimary, isLoading }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={clsx(
        'rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2',
        isPrimary
          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
          : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-600 focus:ring-blue-200',
        isLoading && 'cursor-not-allowed opacity-75',
      )}
    >
      {isLoading ? 'Loading…' : label}
    </button>
  );
}

