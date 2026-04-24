import type { ReactNode } from "react";

export const PageLayout = ({ header, body, footer }: { header: ReactNode, body: ReactNode, footer?: ReactNode }) => {
  return (
    <>
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur sm:p-5 md:p-6">{header}</div>
        <div className="rounded-3xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur sm:p-5 md:p-6">{body}</div>
        {footer && <div className="rounded-3xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur sm:p-5 md:p-6">{footer}</div>}
      </div>
    </>
  );
}


export const Header = ({title, subtitle, searchbar, filters, actions}: { title: string, subtitle?: string, searchbar?: ReactNode, filters?: ReactNode, actions?: ReactNode }) => {
  return (
    <div className="flex flex-col space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
        </div>
        {actions && <div className="flex justify-start sm:justify-end">{actions}</div>}
      </div>
      {(searchbar || filters) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {searchbar && <div className="flex-1">{searchbar}</div>}
          {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
        </div>
      )}
    </div>
  );
}