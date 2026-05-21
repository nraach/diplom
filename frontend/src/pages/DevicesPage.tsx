import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { devicesApi } from "../api/devices.api";
import { DevicesCards } from "../components/DevicesCards";
import { DevicesFilters } from "../components/DevicesFilters";
import { DeviceForm } from "../components/DeviceForm";
import { FloatingToast } from "../components/FloatingToast";
import { DevicesTable } from "../components/DevicesTable";
import { useAuth } from "../hooks/useAuth";
import { usePollingQuery } from "../hooks/usePollingQuery";
import { Device } from "../types/device";
import {
  buildDeviceFilterOptions,
  clearDeviceFilterParams,
  getActiveDeviceFilter,
  matchBuiltInDeviceFilter,
  normalizeText,
  BuiltInDeviceFilterKey
} from "../utils/device-filters";

type ViewMode = "table" | "cards";

export function DevicesPage() {
  const { user } = useAuth();
  const canCreate = user?.role === "admin" || user?.role === "technical_specialist";
  const canEdit = user?.role === "admin";
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const devicesQuery = usePollingQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [activeFilterKey, setActiveFilterKey] = useState(searchParams.get("filterKey") ?? "");
  const [activeFilterValue, setActiveFilterValue] = useState(searchParams.get("attributeValue") ?? "");
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [successToast, setSuccessToast] = useState<{ id: number; message: string } | null>(null);

  const createMutation = useMutation({
    mutationFn: devicesApi.create,
    onSuccess() {
      setSuccessToast({ id: Date.now(), message: "Прибор добавлен." });
      setIsCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof devicesApi.update>[1] }) => devicesApi.update(id, input),
    onSuccess() {
      setSuccessToast({ id: Date.now(), message: "Прибор сохранен." });
      setEditingDevice(null);
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
    }
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: devicesApi.uploadPhoto
  });

  const devices = devicesQuery.data ?? [];
  const filterOptions = useMemo(() => buildDeviceFilterOptions(devices), [devices]);
  const selectedFilterConfig = useMemo(
    () => filterOptions.find((option) => option.key === activeFilterKey) ?? null,
    [activeFilterKey, filterOptions]
  );
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        device.serialNumber.toLowerCase().includes(normalizedQuery) ||
        device.name.toLowerCase().includes(normalizedQuery);

      if (!selectedFilterConfig || !activeFilterValue) {
        return matchesQuery;
      }

      const matchesSelectedFilter = selectedFilterConfig.isCustomAttribute
        ? device.customAttributes.some(
            (attribute) =>
              normalizeText(attribute.label) === normalizeText(selectedFilterConfig.attributeLabel ?? "") &&
              attribute.value === activeFilterValue
          )
        : matchBuiltInDeviceFilter(device, selectedFilterConfig.key as BuiltInDeviceFilterKey, activeFilterValue);

      return matchesQuery && matchesSelectedFilter;
    });
  }, [activeFilterValue, devices, query, selectedFilterConfig]);

  useEffect(() => {
    const nextFilter = getActiveDeviceFilter(searchParams, filterOptions);
    setQuery(searchParams.get("q") ?? "");
    setActiveFilterKey(nextFilter.key);
    setActiveFilterValue(nextFilter.value);
  }, [filterOptions, searchParams]);

  function updateFilters(next: {
    q?: string;
    filterKey?: string;
    filterValue?: string;
  }) {
    const params = new URLSearchParams(searchParams);
    const nextQuery = next.q ?? query;
    const nextSelectedKey = next.filterKey ?? activeFilterKey;
    const nextSelectedValue = next.filterValue ?? activeFilterValue;
    const nextSelectedFilter = filterOptions.find((option) => option.key === nextSelectedKey) ?? null;

    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    clearDeviceFilterParams(params);

    if (nextSelectedFilter) {
      params.set("filterKey", nextSelectedFilter.key);

      if (nextSelectedFilter.isCustomAttribute) {
        params.set("attribute", nextSelectedFilter.attributeLabel ?? "");
      }

      if (nextSelectedValue) {
        if (nextSelectedFilter.isCustomAttribute) {
          params.set("attribute", nextSelectedFilter.attributeLabel ?? "");
          params.set("attributeValue", nextSelectedValue);
        } else {
          params.set(nextSelectedFilter.key, nextSelectedValue);
        }
      }
    }

    setSearchParams(params);
  }

  async function handlePhotoUpload(file: File) {
    const result = await uploadPhotoMutation.mutateAsync(file);
    return result.photoUrl;
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Реестр</p>
          <h2>Приборы</h2>
        </div>
        <div className="page-header-actions">
          {canCreate ? (
            <button type="button" onClick={() => setIsCreateOpen((value) => !value)}>
              {isCreateOpen ? "Скрыть форму" : "Новый прибор"}
            </button>
          ) : null}
        </div>
      </header>

      {successToast ? (
        <FloatingToast key={successToast.id} message={successToast.message} onDismiss={() => setSuccessToast(null)} />
      ) : null}

      {uploadPhotoMutation.error ? (
        <FloatingToast
          key={`devices-upload-${uploadPhotoMutation.error.message}`}
          message={uploadPhotoMutation.error.message}
          variant="error"
          durationMs={4200}
          index={1}
          onDismiss={() => uploadPhotoMutation.reset()}
        />
      ) : null}

      {createMutation.error ? (
        <FloatingToast
          key={`devices-create-${createMutation.error.message}`}
          message={createMutation.error.message}
          variant="error"
          durationMs={4200}
          index={2}
          onDismiss={() => createMutation.reset()}
        />
      ) : null}

      {updateMutation.error ? (
        <FloatingToast
          key={`devices-update-${updateMutation.error.message}`}
          message={updateMutation.error.message}
          variant="error"
          durationMs={4200}
          index={3}
          onDismiss={() => updateMutation.reset()}
        />
      ) : null}

      <DevicesFilters
        query={query}
        activeFilterKey={activeFilterKey}
        activeFilterValue={activeFilterValue}
        filterOptions={filterOptions}
        selectedFilterConfig={selectedFilterConfig}
        viewMode={viewMode}
        onQueryChange={(value) => {
          setQuery(value);
          updateFilters({ q: value });
        }}
        onFilterKeyChange={(value) => {
          setActiveFilterKey(value);
          setActiveFilterValue("");
          updateFilters({ filterKey: value, filterValue: "" });
        }}
        onFilterValueChange={(value) => {
          setActiveFilterValue(value);
          updateFilters({ filterKey: activeFilterKey, filterValue: value });
        }}
        onViewModeChange={setViewMode}
      />

      {isCreateOpen && canCreate ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Новый прибор</h3>
            <button type="button" className="ghost-button" onClick={() => setIsCreateOpen(false)}>
              Закрыть
            </button>
          </div>

          <DeviceForm
            submitLabel="Добавить прибор"
            canEditCustomAttributes={canEdit}
            canEditCalibrationSettings={canEdit}
            onSubmit={(input) => createMutation.mutateAsync(input)}
            onUploadPhoto={handlePhotoUpload}
          />
        </section>
      ) : null}

      {editingDevice && canEdit ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Редактировать прибор</h3>
            <button type="button" className="ghost-button" onClick={() => setEditingDevice(null)}>
              Закрыть
            </button>
          </div>

          <DeviceForm
            device={editingDevice}
            submitLabel="Сохранить прибор"
            canEditStatus
            canEditCustomAttributes
            canEditCalibrationSettings
            onSubmit={(input) => {
              if (input.isWrittenOff && !editingDevice.isWrittenOff && !window.confirm("Списать этот прибор?")) {
                return Promise.resolve();
              }

              return updateMutation.mutateAsync({ id: editingDevice.id, input });
            }}
            onUploadPhoto={handlePhotoUpload}
          />
        </section>
      ) : null}

      {devicesQuery.isLoading ? <section className="panel muted-panel">Загрузка приборов...</section> : null}

      {!devicesQuery.isLoading && filteredDevices.length === 0 ? (
        <section className="panel muted-panel">
          <strong>Нет данных по выбранным фильтрам.</strong>
        </section>
      ) : null}

      {!devicesQuery.isLoading && filteredDevices.length > 0 && viewMode === "table" ? (
        <DevicesTable devices={filteredDevices} canEdit={canEdit} onEdit={setEditingDevice} />
      ) : null}

      {!devicesQuery.isLoading && filteredDevices.length > 0 && viewMode === "cards" ? (
        <DevicesCards devices={filteredDevices} canEdit={canEdit} onEdit={setEditingDevice} />
      ) : null}
    </div>
  );
}
