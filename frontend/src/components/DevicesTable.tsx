import { Link } from "react-router-dom";
import { Device } from "../types/device";
import { deviceStatusLabels } from "../utils/status-labels";
import { StatusBadge } from "./StatusBadge";

type DevicesTableProps = {
  devices: Device[];
  canEdit: boolean;
  onEdit: (device: Device) => void;
};

export function DevicesTable({ devices, canEdit, onEdit }: DevicesTableProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>Список приборов</h3>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Серийный номер</th>
              <th>Название</th>
              <th>Статус</th>
              <th>Калибровка</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td className="strong-cell">{device.serialNumber}</td>
                <td>{device.name}</td>
                <td>
                  <StatusBadge label={deviceStatusLabels[device.currentStatus]} value={device.currentStatus} />
                </td>
                <td>{device.needsCalibrationWarning ? <StatusBadge label="Требуется" value="needs_calibration" /> : "В норме"}</td>
                <td className="actions-cell">
                  <Link to={`/devices/${device.id}`}>Открыть</Link>
                  {canEdit ? (
                    <button type="button" className="link-button" onClick={() => onEdit(device)}>
                      Редактировать
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
