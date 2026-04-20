import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { resolveApiUrl } from "../api/client";
import { CreateDeviceInput, Device, UpdateDeviceInput } from "../types/device";

type DeviceFormInput = CreateDeviceInput & UpdateDeviceInput;

type DeviceFormProps = {
  device?: Device;
  submitLabel: string;
  canEditStatus?: boolean;
  onSubmit: (input: DeviceFormInput) => Promise<unknown>;
  onUploadPhoto?: (file: File) => Promise<string>;
};

export function DeviceForm({
  device,
  submitLabel,
  canEditStatus = false,
  onSubmit,
  onUploadPhoto
}: DeviceFormProps) {
  const [serialNumber, setSerialNumber] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [description, setDescription] = useState("");
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
      setIsWrittenOff(device.isWrittenOff);
      setSelectedPhoto(null);
      return;
    }

    setSerialNumber("");
    setName("");
    setCategory("");
    setPhotoUrl("");
    setDescription("");
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
        ...(canEditStatus ? { isWrittenOff, currentStatus: isWrittenOff ? "written_off" : device?.currentStatus } : {})
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

          <div className="form-grid">
            <label className="form-field">
              <span>Серийный номер</span>
              <input
                value={serialNumber}
                onChange={(event) => setSerialNumber(event.target.value)}
                placeholder="Например: NDT-001"
                required
              />
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
          </div>
        </div>

        <div className="form-actions form-actions-spread">
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
