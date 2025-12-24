export const PageLayout = ({ header, body, footer }: { header: React.ReactNode, body: React.ReactNode, footer?: React.ReactNode }) => {
  return (
    <>
      <div className="p-4 border-b">{header}</div>
      <div className="p-4">{body}</div>
      {footer && <div className="p-4 border-t">{footer}</div>}
    </>
  );
}


export const Header = ({title, subtitle, searchbar, filters, actions}: { title: string, subtitle?: string, searchbar?: React.ReactNode, filters?: React.ReactNode, actions?: React.ReactNode }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </div>
      <div className="flex space-x-2">
        {searchbar}
        {filters}
        {actions}
      </div>
    </div>
  );
}