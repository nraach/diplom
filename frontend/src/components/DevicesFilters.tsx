import { DeviceFilterOption } from "../utils/device-filters";

type DevicesFiltersProps = {
  query: string;
  activeFilterKey: string;
  activeFilterValue: string;
  filterOptions: DeviceFilterOption[];
  selectedFilterConfig: DeviceFilterOption | null;
  viewMode: "table" | "cards";
  onQueryChange: (value: string) => void;
  onFilterKeyChange: (value: string) => void;
  onFilterValueChange: (value: string) => void;
  onViewModeChange: (value: "table" | "cards") => void;
};

export function DevicesFilters({
  query,
  activeFilterKey,
  activeFilterValue,
  filterOptions,
  selectedFilterConfig,
  viewMode,
  onQueryChange,
  onFilterKeyChange,
  onFilterValueChange,
  onViewModeChange
}: DevicesFiltersProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>Фильтры и режим просмотра</h3>
        <div className="segmented-control">
          <button type="button" className={viewMode === "table" ? "active" : ""} onClick={() => onViewModeChange("table")}>
            Таблица
          </button>
          <button type="button" className={viewMode === "cards" ? "active" : ""} onClick={() => onViewModeChange("cards")}>
            Карточки
          </button>
        </div>
      </div>

      <div className="filters filters-extended">
        <input placeholder="Поиск по серийному номеру или названию" value={query} onChange={(event) => onQueryChange(event.target.value)} />

        <select value={activeFilterKey} onChange={(event) => onFilterKeyChange(event.target.value)}>
          <option value="">Выберите фильтр</option>
          {filterOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>

        <select value={activeFilterValue} disabled={!selectedFilterConfig} onChange={(event) => onFilterValueChange(event.target.value)}>
          <option value="">{selectedFilterConfig ? selectedFilterConfig.emptyLabel : "Сначала выберите фильтр"}</option>
          {selectedFilterConfig?.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
