import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

interface StateBlockProps {
  title: string;
  message: string;
}

export function LoadingState({ title = "Loading" }: Partial<Pick<StateBlockProps, "title">>) {
  return (
    <div className="state-block" role="status">
      <LoaderCircle className="state-block__icon state-block__icon--spin" aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>Fetching the latest monitoring data.</p>
      </div>
    </div>
  );
}

export function ErrorState({ title, message }: StateBlockProps) {
  return (
    <div className="state-block state-block--error" role="alert">
      <AlertCircle className="state-block__icon" aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, message }: StateBlockProps) {
  return (
    <div className="state-block">
      <Inbox className="state-block__icon" aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}
