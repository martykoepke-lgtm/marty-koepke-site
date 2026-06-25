/**
 * PageHeader is the standard header used at the top of every authed
 * page. The auth layout provides the sidebar; pages render their own
 * header to control the title, description, and primary action.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-6 mb-8 text-paper">
      <div>
        <h1 className="text-2xl font-semibold text-paper tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-paper/68 mt-1.5 max-w-2xl">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}
