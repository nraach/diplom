import { Link } from "react-router-dom";
import { Device } from "../types/device";
import { deviceStatusLabels } from "../utils/status-labels";
import { StatusBadge } from "./StatusBadge";

type DevicesCardsProps = {
  devices: Device[];
  canEdit: boolean;
  onEdit: (device: Device) => void;
};

export function DevicesCards({ devices, canEdit, onEdit }: DevicesCardsProps) {
  return (
    <section className="device-card-grid">
      {devices.map((device) => (
        <article className="device-card" key={device.id}>
          <div className="device-card-top">
            <div>
              <p className="eyebrow">{device.serialNumber}</p>
              <h3>{device.name}</h3>
            </div>
            <StatusBadge label={deviceStatusLabels[device.currentStatus]} value={device.currentStatus} />
          </div>

          <p className="device-card-meta">{device.category ?? "Без категории"}</p>
          <p className="muted-text">{device.description ?? "Описание не задано"}</p>

          <div className="status-row">
            {device.needsCalibrationWarning ? <StatusBadge label="Требуется калибровка" value="needs_calibration" /> : null}
            <span>{device.serviceCycles.length} цикл(ов)</span>
          </div>

          <div className="card-actions">
            <Link to={`/devices/${device.id}`}>Открыть</Link>
            {canEdit ? (
              <button type="button" className="link-button" onClick={() => onEdit(device)}>
                Редактировать
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
