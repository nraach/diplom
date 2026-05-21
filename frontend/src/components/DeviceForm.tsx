import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { resolveApiUrl } from "../api/client";
import { CreateDeviceInput, Device, DeviceCustomAttribute, UpdateDeviceInput } from "../types/device";
import { DEFAULT_CALIBRATION_INTERVAL_DAYS } from "../utils/calibration";

export type DeviceFormInput = CreateDeviceInput & UpdateDeviceInput;

type DeviceFormProps = {
  device?: Device;
  submitLabel: string;
  canEditStatus?: boolean;
  canEditCustomAttributes?: boolean;
  canEditCalibrationSettings?: boolean;
  onSubmit: (input: DeviceFormInput) => Promise<unknown>;
  onUploadPhoto?: (file: File) => Promise<string>;
};

type CustomAttributeDraft = DeviceCustomAttribute & {
  id: string;
};

export function DeviceForm({
  device,
  submitLabel,
  canEditStatus = false,
  canEditCustomAttributes = false,
  canEditCalibrationSettings = false,
  onSubmit,
  onUploadPhoto
}: DeviceFormProps) {
  const [serialNumber, setSerialNumber] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeDraft[]>([]);
  const [calibrationIntervalDays, setCalibrationIntervalDays] = useState("");
  const [isWrittenOff, setIsWrittenOff] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (device) {
      setSerialNumber(device.serialNumber);
      setName(device.name);
      setCategory(device.category ?? "");
      setPhotoUrl(device.photoUrl ?? "");
      setDescription(device.description ?? "");
      setCustomAttributes(toCustomAttributeDrafts(device.customAttributes));
      setCalibrationIntervalDays(device.calibrationIntervalDays ? String(device.calibrationIntervalDays) : "");
      setIsWrittenOff(device.isWrittenOff);
      setSelectedPhoto(null);
      return;
    }

    setSerialNumber("");
    setName("");
    setCategory("");
    setPhotoUrl("");
    setDescription("");
    setCustomAttributes([]);
    setCalibrationIntervalDays("");
    setIsWrittenOff(false);
    setSelectedPhoto(null);
  }, [device]);

  const previewUrl = useMemo(() => {
    if (selectedPhoto) {
      return URL.createObjectURL(selectedPhoto);
    }

    if (photoUrl) {
      return resolveApiUrl(photoUrl);
    }

    return "";
  }, [photoUrl, selectedPhoto]);

  useEffect(() => {
    return () => {
      if (selectedPhoto) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, selectedPhoto]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let nextPhotoUrl = photoUrl || null;

      if (selectedPhoto && onUploadPhoto) {
        nextPhotoUrl = await onUploadPhoto(selectedPhoto);
      }

      await onSubmit({
        serialNumber,
        name,
        category: category || null,
        photoUrl: nextPhotoUrl,
        description: description || null,
        ...(canEditCalibrationSettings
          ? {
              calibrationIntervalDays: calibrationIntervalDays.trim() ? Number(calibrationIntervalDays) : null
            }
          : {}),
        customAttributes: customAttributes
          .map((attribute) => ({
            label: attribute.label.trim(),
            value: attribute.value.trim()
          }))
          .filter((attribute) => attribute.label && attribute.value),
        ...(canEditStatus ? { isWrittenOff, ...(isWrittenOff ? { currentStatus: "written_off" as const } : {}) } : {})
      });

      if (selectedPhoto) {
        setSelectedPhoto(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedPhoto(file);
  }

  function handleCustomAttributeChange(id: string, field: keyof DeviceCustomAttribute, value: string) {
    setCustomAttributes((current) =>
      current.map((attribute) => (attribute.id === id ? { ...attribute, [field]: value } : attribute))
    );
  }

  function handleAddCustomAttribute() {
    setCustomAttributes((current) => [...current, createEmptyCustomAttribute()]);
  }

  function handleRemoveCustomAttribute(id: string) {
    setCustomAttributes((current) => current.filter((attribute) => attribute.id !== id));
  }

  return (
    <form className="device-form" onSubmit={handleSubmit}>
      <div className="form-surface">
        <div className="form-section">
          <div className="form-section-header">
            <div>
              <p className="eyebrow">Основные данные</p>
              <h4>Параметры прибора</h4>
            </div>
          </div>

          <div className="form-grid device-form-grid">
            <label className="form-field">
              <span>Серийный номер</span>
              <input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} placeholder="Например: NDT-001" required />
            </label>

            <label className="form-field">
              <span>Название</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Название прибора" required />
            </label>

            <label className="form-field">
              <span>Категория</span>
              <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Например: ультразвук" />
            </label>

            <label className="form-field">
              <span>Фото с компьютера</span>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <small className="field-note">Фотография появится в карточке и в списке приборов.</small>
            </label>

            {(previewUrl || photoUrl) && (
              <div className="span-2 photo-preview-panel">
                <span className="eyebrow">Предпросмотр</span>
                <img src={previewUrl || resolveApiUrl(photoUrl)} alt={name || "Фото прибора"} className="photo-preview" />
              </div>
            )}

            <label className="span-2 form-field">
              <span>Описание</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Краткое описание, назначение или заметка"
                rows={4}
              />
            </label>

            {canEditCalibrationSettings ? (
              <label className="form-field">
                <span>Интервал калибровки, дней</span>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  inputMode="numeric"
                  value={calibrationIntervalDays}
                  onChange={(event) => setCalibrationIntervalDays(event.target.value)}
                  placeholder={String(DEFAULT_CALIBRATION_INTERVAL_DAYS)}
                />
                <small className="field-note">
                  Если поле пустое, используется базовое значение: {DEFAULT_CALIBRATION_INTERVAL_DAYS} дней.
                </small>
              </label>
            ) : null}
          </div>
        </div>

        {canEditCustomAttributes ? (
          <div className="form-section">
            <div className="form-section-header">
              <div>
                <p className="eyebrow">Дополнительно</p>
                <h4>Дополнительные свойства</h4>
              </div>
              <button type="button" className="ghost-button" onClick={handleAddCustomAttribute}>
                Добавить свойство
              </button>
            </div>

            {customAttributes.length > 0 ? (
              <div className="custom-attributes-editor">
                {customAttributes.map((attribute) => (
                  <div className="custom-attribute-row" key={attribute.id}>
                    <label className="form-field">
                      <span>Название свойства</span>
                      <input
                        value={attribute.label}
                        onChange={(event) => handleCustomAttributeChange(attribute.id, "label", event.target.value)}
                        placeholder="Например: Цвет"
                      />
                    </label>

                    <label className="form-field">
                      <span>Значение</span>
                      <input
                        value={attribute.value}
                        onChange={(event) => handleCustomAttributeChange(attribute.id, "value", event.target.value)}
                        placeholder="Например: Синий"
                      />
                    </label>

                    <button
                      type="button"
                      className="ghost-button danger-ghost custom-attribute-remove"
                      onClick={() => handleRemoveCustomAttribute(attribute.id)}
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-text">Сюда можно добавить произвольные свойства прибора: цвет, исполнение, комплектацию и другие детали.</p>
            )}

            <p className="form-hint">Пустые строки не сохраняются.</p>
          </div>
        ) : null}

        <div className="form-actions form-actions-spread device-form-actions">
          {canEditStatus ? (
            <label className="checkbox-card">
              <input type="checkbox" checked={isWrittenOff} onChange={(event) => setIsWrittenOff(event.target.checked)} />
              <span>
                <strong>Списан</strong>
                <small>Запретит создание нового сервисного цикла.</small>
              </span>
            </label>
          ) : (
            <span className="form-hint">После сохранения прибор появится в общем списке.</span>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Сохранение..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function createEmptyCustomAttribute(): CustomAttributeDraft {
  return {
    id: createDraftId(),
    label: "",
    value: ""
  };
}

function toCustomAttributeDrafts(attributes: DeviceCustomAttribute[]) {
  return attributes.map((attribute) => ({
    ...attribute,
    id: createDraftId()
  }));
}

function createDraftId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `attr-${Math.random().toString(36).slice(2, 10)}`;
}
