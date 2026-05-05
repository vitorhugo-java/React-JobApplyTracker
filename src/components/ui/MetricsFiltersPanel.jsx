import React from 'react'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'

const MetricsFiltersPanel = ({
  filters,
  onChange,
  onClear,
  statusOptions,
  sourceOptions,
  totalCount,
  filteredCount,
}) => (
  <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Exibindo {filteredCount} de {totalCount} aplicações carregadas.
        </p>
      </div>
      <Button
        type="button"
        label="Limpar filtros"
        outlined
        onClick={onClear}
        data-testid="metrics-clear-filters"
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
      <Calendar
        value={filters.startDate}
        onChange={(event) => onChange({ startDate: event.value })}
        placeholder="Período inicial"
        className="w-full"
        dateFormat="dd/mm/yy"
        showIcon
      />
      <Calendar
        value={filters.endDate}
        onChange={(event) => onChange({ endDate: event.value })}
        placeholder="Período final"
        className="w-full"
        dateFormat="dd/mm/yy"
        showIcon
      />
      <Dropdown
        value={filters.status}
        options={statusOptions}
        onChange={(event) => onChange({ status: event.value })}
        placeholder="Status"
        className="w-full"
        pt={{ root: { 'data-testid': 'metrics-filter-status' } }}
      />
      <Dropdown
        value={filters.source}
        options={sourceOptions}
        onChange={(event) => onChange({ source: event.value })}
        placeholder="Origem"
        className="w-full"
        pt={{ root: { 'data-testid': 'metrics-filter-source' } }}
      />
      <InputText
        value={filters.search}
        onChange={(event) => onChange({ search: event.target.value })}
        placeholder="Buscar vaga, empresa ou recrutador"
        className="w-full"
        data-testid="metrics-filter-search"
      />
    </div>
  </section>
)

export default MetricsFiltersPanel
