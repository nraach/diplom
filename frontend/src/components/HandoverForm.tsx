import { FormEvent, useState } from "react";

type HandoverFormProps = {
  disabled?: boolean;
  onSubmit: (comment: string | null) => Promise<unknown>;
  submitLabel?: string;
};

export function HandoverForm({
  disabled = false,
  onSubmit,
  submitLabel = "Подтвердить передачу"
}: HandoverFormProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(comment || null);
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="handover-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <div className="form-section-header">
          <div>
            <p className="eyebrow">Передача</p>
            <h4>Подтверждение handover</h4>
          </div>
        </div>

        <label className="form-field">
          <span>Комментарий к передаче</span>
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Кому и при каких условиях передан прибор"
            disabled={disabled}
          />
        </label>
      </div>

      <div className="form-actions form-actions-end">
        <button type="submit" disabled={disabled || isSubmitting}>
          {isSubmitting ? "Сохранение..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
