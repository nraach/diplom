import { MutableRefObject } from "react";
import { resolveApiUrl } from "../api/client";
import { Device } from "../types/device";
import { getCalibrationWarningText } from "../utils/calibration";
import { deviceStatusLabels } from "../utils/status-labels";
import { DeviceForm, DeviceFormInput } from "./DeviceForm";
import { StatusBadge } from "./StatusBadge";

type DeviceDetailsOverviewProps = {
  device: Device;
  canManageRecords: boolean;
  isEditingDevice: boolean;
  editDeviceScrollAnchorRef: MutableRefObject<HTMLDivElement | null>;
  editDeviceSectionRef: MutableRefObject<HTMLElement | null>;
  onToggleEditor: () => void;
  onCloseEditor: () => void;
  onSubmit: (input: DeviceFormInput) => Promise<unknown>;
  onUploadPhoto?: (file: File) => Promise<string>;
};

export function DeviceDetailsOverview({
  device,
  canManageRecords,
  isEditingDevice,
  editDeviceScrollAnchorRef,
  editDeviceSectionRef,
  onToggleEditor,
  onCloseEditor,
  onSubmit,
  onUploadPhoto
}: DeviceDetailsOverviewProps) {
  return (
    <>
      <section className="device-details-grid">
        <div className="device-photo">
          {device.photoUrl ? <img src={resolveApiUrl(device.photoUrl)} alt={device.name} /> : <span>Нет фото</span>}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Информация о приборе</h3>
            {canManageRecords ? (
              <button type="button" className="ghost-button" onClick={onToggleEditor}>
                {isEditingDevice ? "Скрыть форму" : "Редактировать"}
              </button>
            ) : null}
          </div>

          <dl className="details-list">
            <div>
              <dt>Статус</dt>
              <dd>
                <StatusBadge label={deviceStatusLabels[device.currentStatus]} value={device.currentStatus} />
              </dd>
            </div>
            <div>
              <dt>Калибровка</dt>
              <dd>
                {device.needsCalibrationWarning ? (
                  <StatusBadge label={getCalibrationWarningText(device)} value="needs_calibration" />
                ) : (
                  getCalibrationWarningText(device)
                )}
              </dd>
            </div>
            <div>
              <dt>Категория</dt>
              <dd>{formatOptionalText(device.category)}</dd>
            </div>
            <div>
              <dt>Описание</dt>
              <dd>{formatOptionalText(device.description)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {device.customAttributes.length > 0 || canManageRecords ? (
        <section className="panel">
          <div className="panel-heading">
            <div className="subsection-heading">
              <h3>Дополнительные свойства</h3>
              {canManageRecords ? <span>Заполняются администратором в режиме редактирования.</span> : null}
            </div>
          </div>

          {device.customAttributes.length > 0 ? (
            <dl className="details-list details-list-single">
              {device.customAttributes.map((attribute, index) => (
                <div key={`${attribute.label}-${index}`}>
                  <dt>{attribute.label}</dt>
                  <dd>{attribute.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted-text">Дополнительные свойства пока не заданы.</p>
          )}
        </section>
      ) : null}

      {canManageRecords ? (
        <div
          ref={editDeviceScrollAnchorRef}
          className={`device-editor-region ${isEditingDevice ? "device-editor-region-open" : ""}`}
        >
          <section className="panel" ref={editDeviceSectionRef} aria-hidden={!isEditingDevice}>
            <div className="panel-heading">
              <h3>Редактировать прибор</h3>
              <button type="button" className="ghost-button" onClick={onCloseEditor}>
                Закрыть
              </button>
            </div>

            <DeviceForm
              device={device}
              submitLabel="Сохранить прибор"
              canEditStatus
              canEditCustomAttributes
              canEditCalibrationSettings
              onSubmit={onSubmit}
              onUploadPhoto={onUploadPhoto}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}

function formatOptionalText(value: string | null) {
  return value?.trim() ? value : "Не задано";
}
