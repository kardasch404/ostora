import Link from 'next/link';

interface JobCardProps {
  id: string | number;
  title: string;
  company: string;
  location?: string;
  type?: string;
  salary?: string;
  posted?: string;
  featured?: boolean;
}

export function JobCard({
  id,
  title,
  company,
  location = 'Remote',
  type = 'Full-time',
  salary,
  posted = 'Recently',
  featured = false,
}: JobCardProps) {
  return (
    <article className="card-flat group hover:shadow-soft hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="icon-wrapper">
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </div>
        {featured && <span className="badge-dark text-xs">Featured</span>}
      </div>

      <h3 className="text-display-sm mb-2 group-hover:underline">{title}</h3>
      <p className="text-body text-gray-600 mb-4">{company}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge text-xs">{location}</span>
        <span className="badge text-xs">{type}</span>
        {salary && <span className="badge text-xs">{salary}</span>}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-body-sm text-gray-400">{posted}</span>
        <Link
          href={`/jobs/${id}`}
          className="text-body-sm font-medium text-black hover:underline inline-flex items-center gap-1"
        >
          View Details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
